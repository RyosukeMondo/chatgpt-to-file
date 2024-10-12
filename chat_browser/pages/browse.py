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

    # Ensure paths exist
    if not Path(monitor_path).exists():
        st.error(f"Monitor path does not exist: {monitor_path}")
        return
    os.makedirs(parsed_path, exist_ok=True)
    if not Path(parsed_path).exists():
        st.error(f"Parsed path does not exist: {parsed_path}")
        return

    # List and sort HTML files by timestamp
    html_files = sorted(
        Path(monitor_path).glob("*.html"),
        key=lambda x: x.stat().st_mtime,
        reverse=True
    )

    if not html_files:
        st.info("No HTML files found in the monitor path.")
        return

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
        with st.spinner("Parsing the selected HTML file..."):
            try:
                parser.parse_and_save(html_file_path, parsed_path)
                st.success("Parsing completed successfully!")
            except Exception as e:
                st.error(f"Error during parsing: {e}")
                return

        parsed_file = os.path.join(parsed_path, f"{Path(selected_file).stem}.json")

        if os.path.exists(parsed_file):
            # add button to remove existing parsed_file.
            if st.button("Remove existing parsed file"):
                os.remove(parsed_file)
                st.success("Removed existing parsed file.")
                return

            with open(parsed_file, 'r', encoding='utf-8') as f:
                parsed_json = json.load(f)
            
            st.json(parsed_json)

            converter = ConverterManager()
            with st.spinner("Converting parsed content to Markdown..."):
                try:
                    markdown_content = converter.convert(parsed_json['message']['content'], format_type='markdown')
                    st.success("Conversion completed successfully!")
                except ValueError as ve:
                    st.error(str(ve))
                    return
                except Exception as e:
                    st.error(f"Error during conversion: {e}")
                    return

            st.markdown(markdown_content, unsafe_allow_html=True)
        else:
            st.error("Parsed file not found.")


if __name__ == "__main__":
    main()
