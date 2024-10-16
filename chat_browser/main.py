# main.py
import streamlit as st
from pages import browse, config


st.set_page_config(page_title="Chat Browser", layout="wide")

st.sidebar.title("Navigation")
selection = st.sidebar.radio("Go to", ["Browse", "Configuration"])

if selection == "Browse":
    browse.main()
elif selection == "Configuration":
    config.main()
