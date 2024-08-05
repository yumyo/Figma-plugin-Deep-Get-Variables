# Deep Get Variables

The **Deep Get Variables** plugin for **Dev Mode** allows users to get all variables contained in a selection recursively, and optionally transform them into Design Tokens names with a custom prefix for Android and iOS formats.

---

<img src="https://github.com/yumyo/deep-get-variables/raw/main/DGV-logo.svg" alt="Deep Get Variables" width="666">

## Features

- Retrieve all variables from a selected layer or component in Figma.
- Display variables in a structured format.
- Optionally transform variable names into Design Tokens for Android and iOS.
- Customise the prefix for the generated Design Tokens names.
- Click copy to clipboard.

## Usage

1. **Open Dev Mode**: Make sure Dev Mode is enabled.
2. **Select Elements**: Select the elements in your Figma document from which you want to retrieve variables.
3. **Run the Plugin**: Open the **Deep Get Variables** plugin.
4. **View Variables**: The plugin will display all variables contained in the selection.
5. **Transform Names (Optional)**:
    - Check the "Transform Design Tokens Names" option.
    - Enter a custom prefix for the variable names.
    - Click "Generate" to see the transformed names for Android and iOS.
6. **Copy to Clipboard**: Use the "Copy" button next to the transformed names to copy them to the clipboard.

## Installation

1. Download and install the plugin from the Figma Plugin Library.
2. Alternatively, you can download the source code and load it as a custom plugin in Figma.

## Development

To develop and modify the plugin:

1. Clone this repository:
    ```sh
    git clone https://github.com/yourusername/deep-get-variables.git
    ```
2. Navigate to the plugin directory:
    ```sh
    cd deep-get-variables
    ```
3. Install dependencies:
    ```sh
    npm install
    ```
4. Build the plugin:
    ```sh
    npm run build
    ```
5. Load the `manifest.json` file in Figma to use the plugin.

## New Feature Requests

If you have ideas for new features or improvements, we would love to hear from you! Please submit your feature requests by creating a new issue on our GitHub repository. Provide as much detail as possible, including the problem the feature will solve, potential use cases, and any specific requirements or examples. 

Also pull requests are more than welcome! With your contributions help make this project better for everyone, and we appreciate your feedback and suggestions.

## Credits

Network by Anwar Hossain from <a href="https://thenounproject.com/browse/icons/term/network/" target="_blank" title="Network Icons">Noun Project</a> (CC BY 3.0)

## License

This project is licensed under the Figma Community Free Resource License. See the [LICENSE](LICENSE) file for details.

