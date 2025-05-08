from fastapi import FastAPI
from pydantic import BaseModel
from better_profanity import profanity
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)


print('API call is madeeeeeeeeeeeeeeeeeeeeeee')
profanity.load_censor_words()

class ContentRequest(BaseModel):
    text: Optional[str] = None
    censoring_char: str = "*"

class ContentResponse(BaseModel):
    status: str
    moderated_text: Optional[str] = None
    contains_profanity: Optional[bool] = None

@app.post("/check-content", response_model=ContentResponse)
async def check_content(content: ContentRequest):
    response_data = {"status": "safe"}

    if content.text:
        contains_profanity = profanity.contains_profanity(content.text)
        moderated_text = profanity.censor(content.text).replace("*", content.censoring_char)
        response_data.update({
            "moderated_text": moderated_text,
            "contains_profanity": contains_profanity
        })
        if contains_profanity:
            response_data["status"] = "unsafe"

    return response_data 