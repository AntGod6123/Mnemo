from fastapi import APIRouter
from pydantic import BaseModel
import re
import argostranslate.package, argostranslate.translate
from langdetect import detect, LangDetectException
from routes.zim_loader import get_article

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    from_lang: str
    to_lang: str


class TranslateArticleRequest(BaseModel):
    zim_id: str
    path: str
    to_lang: str

@router.get("/translate/models")
def list_models():
    return [
        {
            "from_code": t.from_code,
            "to_code": t.to_code,
            "from_name": t.from_name,
            "to_name": t.to_name,
        }
        for lang in argostranslate.translate.get_installed_languages()
        for t in lang.translations
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


@router.post("/translate/article")
def translate_article(req: TranslateArticleRequest):
    article = get_article(req.zim_id, req.path)
    if not article:
        return {"error": "Article not found"}

    text = re.sub("<[^>]+>", " ", article.content or "")
    try:
        detected = detect(text)
    except LangDetectException:
        detected = "en"

    installed_languages = argostranslate.translate.get_installed_languages()
    from_lang = next((l for l in installed_languages if l.code == detected), None)
    to_lang = next((l for l in installed_languages if l.code == req.to_lang), None)

    if from_lang and to_lang:
        translation = from_lang.get_translation(to_lang)
        translated_text = translation.translate(text)
        return {"translated": translated_text}
    else:
        return {"error": "Translation language pair not found"}
