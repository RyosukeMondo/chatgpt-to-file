# pages/browse.py
import streamlit as st
import os
from pathlib import Path
from components.config_manager import ConfigManager
from components.message_parser import MessageParser
from components.to_markdown import ConverterManager
import json


def main():
    st.title("Chat Browser - Browse Messages")

    config_manager = ConfigManager()
    monitor_path = config_manager.get('monitor_path')
    parsed_path = config_manager.get('parsed_path')

    # List and sort HTML files by timestamp
    html_files = sorted(
        Path(monitor_path).glob("*.html"),
        key=lambda x: x.stat().st_mtime,
        reverse=True
    )

    options = [str(f.name) for f in html_files]
    selected_file = st.selectbox("Select a message file", options)

    if selected_file:
        html_file_path = os.path.join(monitor_path, selected_file)
        # show in max height 400 with scrollable content
        st.components.v1.html(
            f'<div style="height: 400px; overflow-y: scroll;">{open(html_file_path, "r", encoding="utf-8").read()}</div>',
            height=400
        )

        parser = MessageParser()
        parser.parse_and_save(html_file_path, parsed_path)

        parsed_file = os.path.join(parsed_path, f"{Path(selected_file).stem}.json")
        if os.path.exists(parsed_file):
            with open(parsed_file, 'r', encoding='utf-8') as f:
                parsed_json = json.load(f)
            
            st.json(parsed_json)

            converter = ConverterManager()
            markdown_content = converter.convert(parsed_json['message']['content'], format_type='markdown')

            st.markdown(markdown_content, unsafe_allow_html=True)
        else:
            st.error("Parsed file not found.")


if __name__ == "__main__":
    main()
