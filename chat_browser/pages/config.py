# pages/config.py
import streamlit as st
from components.config_manager import ConfigManager

def main():
    st.title("Configuration")

    config_manager = ConfigManager()

    monitor_path = st.text_input("Monitor Path", value=config_manager.get('monitor_path'))
    parsed_path = st.text_input("Parsed Path", value=config_manager.get('parsed_path'))

    if st.button("Save Configuration"):
        new_config = {
            'monitor_path': monitor_path,
            'parsed_path': parsed_path
        }
        config_manager.save_config(new_config)
        st.success("Configuration saved successfully!")

if __name__ == "__main__":
    main()
