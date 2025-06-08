from fastapi import APIRouter
from pydantic import BaseModel
import argostranslate.package, argostranslate.translate

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    from_lang: str
    to_lang: str

@router.get("/translate/models")
def list_models():
    return [
        {
            "from_code": p.from_code,
            "to_code": p.to_code,
            "from_name": p.from_name,
            "to_name": p.to_name
        }
        for p in argostranslate.translate.get_installed_languages()
        for p in p.translations
    ]

@router.post("/translate")
def translate(req: TranslateRequest):
    installed_languages = argostranslate.translate.get_installed_languages()
    from_lang = next((l for l in installed_languages if l.code == req.from_lang), None)
    to_lang = next((l for l in installed_languages if l.code == req.to_lang), None)

    if from_lang and to_lang:
        translation = from_lang.get_translation(to_lang)
        translated_text = translation.translate(req.text)
        return {"translated": translated_text}
    else:
        return {"error": "Translation language pair not found"}
