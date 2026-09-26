import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from core.vector_store import build_vector_store, load_vector_store, get_retriever

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash-lite",
        google_api_key=os.getenv("GEMINI_API_KEY"),
        temperature=0.3,
    )

def format_docs(docs):
    return "\n\n".join([doc.page_content for doc in docs])

def build_rag_chain(transcript:str):

    vector_store = build_vector_store(transcript)

    retriever = get_retriever(vector_store, k = 15)

    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages(

        [(
            "system",
            """You are an expert meeting assistant. Answer the user's question 
based ONLY on the meeting transcript context provided below.

If the answer is not found in the context, say: 
"I could not find this information in the meeting transcript."

Always be concise and precise. If quoting someone, mention it clearly.
IMPORTANT: Output plain text only. Do NOT use markdown formatting like asterisks (*), bold (**), or code blocks.

Context from meeting transcript:
{context}

IMPORTANT: You must write your final response in {language} language.""",
        ),
        ("human", "{question}"),
    ]
    )

    #full LCEL Rag pipeline 

    from operator import itemgetter
    rag_chain = (

        {"context" : itemgetter("question") | retriever | RunnableLambda(format_docs),
         "question": itemgetter("question"),
         "language": itemgetter("language")
         }
         |prompt|llm|StrOutputParser()
    )

    return rag_chain


def load_rag_chain():
    vector_store = load_vector_store()
    retriever = get_retriever(vector_store, k=15)

    llm = get_llm()
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are an expert meeting assistant. Answer the user's question 
based ONLY on the meeting transcript context provided below.

If the answer is not found in the context, say: 
"I could not find this information in the meeting transcript."

Always be concise and precise. If quoting someone, mention it clearly.
IMPORTANT: Output plain text only. Do NOT use markdown formatting like asterisks (*), bold (**), or code blocks.

Context from meeting transcript:
{context}

IMPORTANT: You must write your final response in {language} language.""",
        ),
        ("human", "{question}"),
    ])

    from operator import itemgetter
    rag_chain = (
        {
            "context":  itemgetter("question") | retriever | RunnableLambda(format_docs),
            "question": itemgetter("question"),
            "language": itemgetter("language")
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain


def ask_question(rag_chain, question:str, language:str="english") -> str:
    print(f"Question : {question}, Language: {language}")
    answer = rag_chain.invoke({"question": question, "language": language})
    print(f"answer :{answer}")
    return answer
