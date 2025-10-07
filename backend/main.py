import databases
import sqlalchemy
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
fro

# Database configuration
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./test.db")
database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# Memo table
memos = sqlalchemy.Table(
    "memos",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("text", sqlalchemy.String),
)

if DATABASE_URL.startswith("sqlite"):
    engine = sqlalchemy.create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = sqlalchemy.create_engine(DATABASE_URL)
metadata.create_all(engine)


# Pydantic models
class MemoIn(BaseModel):
    text: str


class Memo(BaseModel):
    id: int
    text: str


app = FastAPI()

# CORS middleware
origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/memos", response_model=list[Memo])
async def read_memos():
    query = memos.select()
    return await database.fetch_all(query)


@app.post("/memos", response_model=Memo)
async def create_memo(memo: MemoIn):
    query = memos.insert().values(text=memo.text)
    last_record_id = await database.execute(query)
    return {**memo.dict(), "id": last_record_id}


@app.put("/memos/{memo_id}", response_model=Memo)
async def update_memo(memo_id: int, memo: MemoIn):
    query = memos.update().where(memos.c.id == memo_id).values(text=memo.text)
    await database.execute(query)
    return {**memo.dict(), "id": memo_id}


@app.delete("/memos/{memo_id}")
async def delete_memo(memo_id: int):
    query = memos.delete().where(memos.c.id == memo_id)
    await database.execute(query)
    return {"message": "Memo deleted successfully!"}
