import json
import os

DB_PATH = os.getenv("DB_PATH", "housekeeping_server.db")
API_AUTH_TOKEN = os.getenv("API_AUTH_TOKEN", "hk_secret_token_2026")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(BASE_DIR)

I18N_PATHS_TO_CHECK = [
    os.getenv("I18N_PATH"),
    os.path.join(BASE_DIR, "i18n", "en-us.i18n.json"),
    os.path.join(REPO_ROOT, "server", "i18n", "en-us.i18n.json"),
]

def _resolve_i18n_path() -> str:
    for p in I18N_PATHS_TO_CHECK:
        if p and os.path.exists(p):
            return p
    searched_paths = ", ".join([str(p) for p in I18N_PATHS_TO_CHECK if p])
    raise FileNotFoundError(
        f"i18n translation file 'en-us.i18n.json' could not be found. Searched paths: [{searched_paths}]"
    )

# Ensure translation file exists at server startup
I18N_PATH = _resolve_i18n_path()

# Backend owns preinstalled task keys (snake_case) and their default repeat frequency in days
PREINSTALLED_TASKS = [
    ("mow_gras", 182),
    ("bed_replace_sheets", 7),
    ("bathroom", 14),
    ("toilets", 14),
    ("kitchen_cabinets_outside", 30),
    ("furniture_living_room", 14),
    ("mop_bathroom", 30),
    ("mop_toilets", 30),
    ("oven", 30),
    ("coffee_machine", 30),
    ("shower", 60),
    ("mop_upstairs", 60),
    ("laundromat_cleaning_program", 60),
    ("cat_litter", 91),
    ("bedroom", 60),
    ("fridge_check_dates_and_clean", 91),
    ("mop_living_room", 91),
    ("laundromat_waste_water", 91),
    ("vacuum_cleaner_filter", 91),
    ("windows_outside", 91),
    ("windows_inside", 91),
    ("car_outside", 91),
    ("car_inside", 91),
    ("dishwasher", 91),
    ("bathroom_air_filter", 182),
    ("kitchen_cabinets_inside", 182),
    ("bathroom_cabinets", 182),
    ("slats_kitchen_window", 182),
    ("scrub_cooktop", 182),
    ("pantry_check_dates_and_clean", 182),
    ("bathroom_walls", 365),
    ("doors", 365),
    ("bathroom_ground_lines", 365),
    ("kitchen_extractor_hood", 365),
    ("bed_baby", 7),
    ("dryer_maintenance", 30),
]



