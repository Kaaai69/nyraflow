"""Telegram-обвязка вокруг core.py: /start, /reset, текст клиента, доставка менеджеру."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import socket
from collections import defaultdict
from pathlib import Path

from aiogram import Bot, Dispatcher, F
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.filters import Command, CommandStart
from aiogram.types import BotCommand, Message, User
from aiogram.utils.chat_action import ChatActionSender
from dotenv import load_dotenv

import core
from llm import OpenAICompatLLM
from storage import SessionStore

log = logging.getLogger("kitchen-bot")


async def apply_profile(bot: Bot, profile: dict[str, str]) -> None:
    """Имя и описания бота — из config.json, а не руками в @BotFather.

    Трогаем только то, что отличается: у setMyName жёсткий лимит частоты.
    """
    try:
        if profile.get("name") and (await bot.get_my_name()).name != profile["name"]:
            await bot.set_my_name(name=profile["name"])
        if profile.get("description") and (
            (await bot.get_my_description()).description != profile["description"]
        ):
            await bot.set_my_description(description=profile["description"])
        if profile.get("short_description") and (
            (await bot.get_my_short_description()).short_description != profile["short_description"]
        ):
            await bot.set_my_short_description(short_description=profile["short_description"])
    except Exception:
        log.exception("не удалось обновить профиль бота — работаем дальше")


def user_label(user: User | None) -> str:
    if user is None:
        return "клиент"
    name = user.full_name or "без имени"
    return f"{name} (@{user.username})" if user.username else f"{name} (id {user.id})"


async def main() -> None:
    here = Path(__file__).parent
    load_dotenv(here / ".env")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    cfg = json.loads(Path(os.getenv("BOT_CONFIG", here / "config.json")).read_text("utf-8"))
    manager_chat_id = os.getenv("MANAGER_CHAT_ID") or cfg.get("manager_chat_id")
    temperature = os.getenv("LLM_TEMPERATURE")
    llm = OpenAICompatLLM(
        os.getenv("LLM_BASE_URL", "https://polza.ai/api/v1"),
        os.environ["LLM_API_KEY"],
        os.getenv("LLM_MODEL", "anthropic/claude-haiku-5.5"),
        temperature=float(temperature) if temperature else None,
        reasoning_effort=os.getenv("LLM_REASONING_EFFORT", "low") or None,
    )
    store = SessionStore(os.getenv("DATA_DIR", here / "data"))
    # На сервере нет IPv6, а api.telegram.org отдаёт AAAA-запись: aiohttp сначала стучится
    # по IPv6 и первый запрос падает по таймауту. Публичного параметра нет — правим конфиг коннектора.
    tg_session = AiohttpSession()
    tg_session._connector_init["family"] = socket.AF_INET
    bot = Bot(os.environ["TELEGRAM_TOKEN"], session=tg_session)
    dp = Dispatcher()
    locks: defaultdict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    async def to_manager(text: str) -> None:
        if not manager_chat_id:
            return
        try:
            await bot.send_message(manager_chat_id, text)
        except Exception:
            log.exception("не доставили менеджеру")

    async def deliver(message: Message, out: list[core.Outgoing]) -> None:
        chat_id = str(message.chat.id)
        for o in out:
            if o.to == "client":
                await message.answer(o.text)
                store.log(chat_id, "bot", o.text)
            else:
                await to_manager(o.text)

    @dp.message(CommandStart())
    @dp.message(Command("reset"))
    async def on_start(message: Message) -> None:
        chat_id = str(message.chat.id)
        async with locks[chat_id]:
            session = core.Session(chat_id=chat_id)
            out = core.start(session, cfg)
            store.save(session)
            store.log(chat_id, "client", message.text or "")
            await deliver(message, out)
        await to_manager(f"👤 Демо открыл: {user_label(message.from_user)}")

    @dp.message(F.text)
    async def on_text(message: Message) -> None:
        chat_id = str(message.chat.id)
        async with locks[chat_id]:
            session = store.load(chat_id)
            store.log(chat_id, "client", message.text)
            async with ChatActionSender.typing(chat_id=message.chat.id, bot=bot):
                out = await core.process_message(
                    session, message.text, user_label(message.from_user), cfg, llm
                )
            store.save(session)
            await deliver(message, out)

    @dp.message()
    async def on_other(message: Message) -> None:
        await message.answer("Пока понимаю только текст — напишите, пожалуйста, словами.")

    await bot.set_my_commands([
        BotCommand(command="start", description="Начать заново"),
        BotCommand(command="reset", description="Сбросить диалог"),
    ])
    await apply_profile(bot, cfg.get("bot_profile", {}))
    me = await bot.get_me()
    log.info("запущен @%s, модель %s, менеджер %s", me.username, llm.model, manager_chat_id or "—")
    try:
        await dp.start_polling(bot)
    finally:
        await llm.aclose()


if __name__ == "__main__":
    asyncio.run(main())
