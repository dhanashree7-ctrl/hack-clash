from fastapi import FastAPI

app = FastAPI(title="PulseSphere AI")

@app.get("/")
def read_root():
    return {"message": "Welcome to the PulseSphere AI API"}
