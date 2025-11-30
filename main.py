#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# --- Question Bank ---
QUESTIONS = [
    {
        'question_text': 'What is the next number in the sequence: 2, 4, 8, 16, ?',
        'options': ['24', '32', '64', '128'],
        'correct_index': 1,
    },
    {
        'question_text': 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?',
        'options': ['$0.05', '$0.10', '$0.15', '$1.00'],
        'correct_index': 0,
    },
    {
        'question_text': 'How many months have 28 days?',
        'options': ['1', '2', '6', 'All 12'],
        'correct_index': 3,
    },
    {
        'question_text': 'If you are running a race and you pass the person in second place, what place are you in?',
        'options': ['First', 'Second', 'Third', 'Fourth'],
        'correct_index': 1,
    },
    {
        'question_text': 'What is 3/7 chicken, 2/3 cat, and 2/4 goat?',
        'options': ['Chicago', 'New York', 'London', 'Paris'],
        'correct_index': 0,
    },
]

# --- Bot Handlers ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends the first question when the user starts the bot."""
    context.user_data['question_index'] = 0
    context.user_data['score'] = 0

    await send_question(update.message.chat_id, context)


async def button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Parses the CallbackQuery and updates the message text."""
    query = update.callback_query
    await query.answer()

    selected_option_index = int(query.data)
    question_index = context.user_data.get('question_index', 0)

    # Check if the answer is correct
    if selected_option_index == QUESTIONS[question_index]['correct_index']:
        context.user_data['score'] = context.user_data.get('score', 0) + 1

    # Move to the next question
    context.user_data['question_index'] = question_index + 1

    # Delete the previous question message
    await query.delete_message()

    if context.user_data['question_index'] < len(QUESTIONS):
        await send_question(query.message.chat_id, context)
    else:
        await show_results(query.message.chat_id, context)


async def send_question(chat_id: int, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends the current question with its options."""
    question_index = context.user_data.get('question_index', 0)
    question_data = QUESTIONS[question_index]

    keyboard = [
        [InlineKeyboardButton(option, callback_data=str(i))]
        for i, option in enumerate(question_data['options'])
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await context.bot.send_message(
        chat_id,
        text=question_data['question_text'],
        reply_markup=reply_markup
    )


async def show_results(chat_id: int, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Calculates and shows the final results."""
    score = context.user_data.get('score', 0)
    total_questions = len(QUESTIONS)

    # Calculate IQ (linear scale from 70 to 140)
    iq = 70 + (score / total_questions) * 70

    # Determine status
    if iq < 85:
        status = "Below Average"
    elif 85 <= iq < 115:
        status = "Average"
    elif 115 <= iq < 130:
        status = "Above Average"
    else:
        status = "Gifted"

    results_text = (
        f"Quiz Finished!\n\n"
        f"Your Score: {score}/{total_questions}\n"
        f"Your Calculated IQ: {int(iq)}\n"
        f"Status: {status}"
    )

    keyboard = [[InlineKeyboardButton("Try Again", callback_data='start_over')]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await context.bot.send_message(
        chat_id,
        text=results_text,
        reply_markup=reply_markup
    )

async def start_over(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Resets the quiz when the 'Try Again' button is clicked."""
    query = update.callback_query
    await query.answer()

    context.user_data['question_index'] = 0
    context.user_data['score'] = 0

    await query.delete_message()
    await send_question(query.message.chat_id, context)


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log the error and send a telegram message to notify the developer."""
    logger.error("Exception while handling an update:", exc_info=context.error)


def main() -> None:
    """Run the bot."""
    # --- PASTE YOUR BOT TOKEN HERE ---
    BOT_TOKEN = "YOUR_BOT_TOKEN"

    application = ApplicationBuilder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button, pattern=r"^[0-9]$"))
    application.add_handler(CallbackQueryHandler(start_over, pattern=r"^start_over$"))

    # ...and the error handler
    application.add_error_handler(error_handler)

    # Run the bot until the user presses Ctrl-C
    application.run_polling()


if __name__ == '__main__':
    main()
