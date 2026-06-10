import os
import json
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

SHEET_CHAT_TAB       = "ChatHistory"
SHEET_REFLECTION_TAB = "ReflectionLog"

CHAT_HEADERS       = ["nama", "lab", "turn", "timestamp", "role", "pesan", "response_time", "token_input", "token_output", "total_token"]
REFLECTION_HEADERS = ["nama", "pertanyaan_refleksi", "jawaban_siswa", "feedback_ai", "response_time_ai", "token_input", "token_output", "total_token"]


def _get_client() -> gspread.Client:
    creds_json = os.getenv("GOOGLE_SHEETS_CREDENTIALS")
    if not creds_json:
        raise EnvironmentError("GOOGLE_SHEETS_CREDENTIALS env var not set")
    creds_dict = json.loads(creds_json)
    creds = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
    return gspread.authorize(creds)


def _get_spreadsheet() -> gspread.Spreadsheet:
    spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
    if not spreadsheet_id:
        raise EnvironmentError("GOOGLE_SHEETS_SPREADSHEET_ID env var not set")
    return _get_client().open_by_key(spreadsheet_id)


def _ensure_tab(spreadsheet: gspread.Spreadsheet, title: str, headers: list) -> gspread.Worksheet:
    """Get or create the worksheet and ensure the header row exists."""
    try:
        ws = spreadsheet.worksheet(title)
    except gspread.WorksheetNotFound:
        ws = spreadsheet.add_worksheet(title=title, rows=1000, cols=len(headers))

    # Write headers only if the sheet is empty
    if ws.row_count == 0 or not ws.row_values(1):
        ws.append_row(headers, value_input_option="USER_ENTERED")

    return ws


def append_chat_log(
    name: str,
    lab: str,
    turn: int,
    timestamp: str,
    student_message: str,
    ai_message: str,
    response_time: float,
    token_input: int,
    token_output: int,
    total_token: int
) -> None:
    """
    Append two rows to ChatHistory: one for the student message and one for the AI reply.
    response_time (seconds) is recorded only on the AI row.
    """
    spreadsheet = _get_spreadsheet()
    ws = _ensure_tab(spreadsheet, SHEET_CHAT_TAB, CHAT_HEADERS)

    ws.append_rows(
        [
            [name, lab, turn, timestamp, "student", student_message, ""],
            [name, lab, turn, timestamp, "ai",      ai_message,      round(response_time, 3), token_input, token_output, total_token],
        ],
        value_input_option="USER_ENTERED",
    )


def append_reflection_log(
    name: str,
    question: str,
    student_answer: str,
    ai_feedback: str,
    response_time: float,
    token_input: int,
    token_output: int,
    total_token: int
) -> None:
    """Append one row to ReflectionLog."""
    spreadsheet = _get_spreadsheet()
    ws = _ensure_tab(spreadsheet, SHEET_REFLECTION_TAB, REFLECTION_HEADERS)

    ws.append_row(
        [name, question, student_answer, ai_feedback, round(response_time, 3), token_input, token_output, total_token],
        value_input_option="USER_ENTERED",
    )
