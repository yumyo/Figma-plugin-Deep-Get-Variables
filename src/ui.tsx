import {
  Button,
  Container,
  render,
  TextboxMultiline,
  Textbox,
  VerticalSpace,
  Checkbox,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h, Fragment } from "preact";
import { useCallback, useState, useEffect } from "preact/hooks";
import { CloseHandler, VariableUpdateHandler } from "./types";

// Define the interface for VariableInfo
interface VariableInfo {
  name: string;
  type: string;
  nodeName: string;
}

function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function Plugin() {
  const [parseTextStyles, setParseTextStyles] = useState(false);
  const [variables, setVariables] = useState<VariableInfo[]>([]);
  const [prefix, setPrefix] = useState("");
  const [customText, setCustomText] = useState(
    "Font Size\nLine Height\nFont Weight"
  );
  const [transformNames, setTransformNames] = useState(false);
  const [androidFormat, setAndroidFormat] = useState("");
  const [iosFormat, setIosFormat] = useState("");

  useEffect(() => {
    const handleMessages = (event: MessageEvent) => {
      const { pluginMessage } = event.data;
      if (pluginMessage.type === "variables") {
        setVariables(pluginMessage.data);
        if (transformNames) {
          transformAndDisplay(pluginMessage.data);
        }
      }
    };

    window.addEventListener("message", handleMessages);
    window.parent.postMessage({ pluginMessage: { type: "getSelection" } }, "*");

    return () => window.removeEventListener("message", handleMessages);
  }, [transformNames]);

  const handleParseTextStylesChange = useCallback(() => {
    setParseTextStyles(!parseTextStyles);
    emit<VariableUpdateHandler>("VARIABLE_UPDATE");
  }, [parseTextStyles]);

  const handleCustomTextChange = useCallback((event: Event) => {
    setCustomText((event.target as HTMLInputElement).value);
  }, []);

  const handlePrefixChange = useCallback((event: Event) => {
    setPrefix((event.target as HTMLInputElement).value);
  }, []);

  const handleTransformNamesChange = useCallback(() => {
    setTransformNames(!transformNames);
  }, [transformNames]);

  const handleCloseButtonClick = useCallback(() => {
    emit<CloseHandler>("CLOSE");
  }, []);

  const transformVariableNames = useCallback(
    (variableNames: string[], prefix: string) => {
      const androidFormat = variableNames.map((name) =>
        (prefix + "_" + name.toLowerCase().replace(/\s/g, "_").replace(/\/|-/g, "_")).trim()
      );

      const iosFormat = variableNames.map((name) => {
        let iosName = (prefix + name)
          .replace(/-(.)/g, (_, p1) => p1.toUpperCase())
          .replace(/[_\s\/-]/g, "");
        return iosName.charAt(0).toLowerCase() + iosName.slice(1);
      });

      return { androidFormat, iosFormat };
    },
    []
  );

  const transformAndDisplay = useCallback(
    (variableNames: VariableInfo[]) => {
      const names = variableNames.map((variable) => variable.name);
      const { androidFormat, iosFormat } = transformVariableNames(names, prefix);

      setAndroidFormat(androidFormat.join("\n"));
      setIosFormat(iosFormat.join("\n"));
    },
    [prefix, transformVariableNames]
  );

  useEffect(() => {
    transformAndDisplay(variables);
  }, [variables, prefix, transformNames]);

  return (
    <Container space="medium">
      <VerticalSpace space="medium" />
      <h2>Deep Get Variables</h2>
      <p>
        Get all variables contained in a selection and optionally generate
        Design Tokens names.
      </p>
      <VerticalSpace space="medium" />
      <h3>Properties overview</h3>
      <pre id="properties-list" className="small">
        {variables.length === 0
          ? "No variables found"
          : variables.map((variable) => (
              <div className="variable-property" key={variable.name}>
                <label className="variable-label bold mt-1">
                  {toTitleCase(variable.nodeName)} (Layer Name)
                </label>
                <div className="variable-details">
                  {"  "}
                  {toTitleCase(variable.type)}:{" "}
                  <span className="accent">{variable.name}</span>
                </div>
              </div>
            ))}
      </pre>
      <VerticalSpace space="medium" />
      <div className="flex row " style={{ alignItems: "baseline" }}>
        <h3 className="mr-1">Variables</h3>
        <Button
          id="copyVariables"
          className="copy-button"
          onClick={() => copyToClipboard("variable-list")}
        >
          Copy
        </Button>
      </div>
      <pre id="variable-list" className="accent">
        {variables.map((variable) => variable.name).join("\n")}
      </pre>
      <VerticalSpace space="medium" />
      <Checkbox
        name="transformNames"
        onValueChange={handleTransformNamesChange}
        value={transformNames}
      >
        Transform Design Tokens Names
      </Checkbox>
      <VerticalSpace space="medium" />
      <Checkbox
        name="parseTextStyles"
        onValueChange={handleParseTextStylesChange}
        value={parseTextStyles}
      >
        Parse Text Styles
      </Checkbox>
      <VerticalSpace space="medium" />
      {parseTextStyles && (
        <>
          <VerticalSpace space="medium" />
          <TextboxMultiline
            onInput={handleCustomTextChange}
            value={customText}
          />
        </>
      )}
      <VerticalSpace space="medium" />
      {transformNames && (
        <div id="transformOptions">
          <VerticalSpace space="medium" />
          <div className="flex row" style={{ alignItems: "baseline" }}>
            <label className="mb-1 mr-1">
              <div className="flex row" style={{ alignItems: "baseline" }}>
                <span className="mr-1">Prefix: </span>
                <Textbox value={prefix} onInput={handlePrefixChange} />
              </div>
            </label>
            <Button
              className="mb-1"
              onClick={() => transformAndDisplay(variables)}
            >
              Generate
            </Button>
          </div>
          <VerticalSpace space="medium" />
          <div className="flex column align-start">
            <div className="flex row" style={{ alignItems: "baseline" }}>
              <h3 className="mr-1">Android Format</h3>
              <Button
                id="copyAndroid"
                className="copy-button"
                onClick={() => copyToClipboard("androidFormat")}
              >
                Copy
              </Button>
            </div>
            <pre id="androidFormat" className="attention m-0 width border-box">
              {androidFormat}
            </pre>
          </div>
          <VerticalSpace space="medium" />
          <div className="flex column align-start">
            <div className="flex row" style={{ alignItems: "baseline" }}>
              <h3 className="mr-1">iOS Format</h3>
              <Button
                id="copyIos"
                className="copy-button"
                onClick={() => copyToClipboard("iosFormat")}
              >
                Copy
              </Button>
            </div>
            <pre id="iosFormat" className="attention m-0 width border-box">
              {iosFormat}
            </pre>
          </div>
          <VerticalSpace space="medium" />
          <div className="flex column align-start">
            <div className="flex row" style={{ alignItems: "baseline" }}>
              <h3 className="mr-1">CSS Variables</h3>
              <Button
                id="copyCss"
                className="copy-button"
                onClick={() => copyToClipboard("cssFormat")}
              >
                Copy
              </Button>
            </div>
            <pre id="cssFormat" className="m-0 width border-box">
              {/* Handle CSS format similar to Android and iOS if needed */}
            </pre>
          </div>
        </div>
      )}
      <VerticalSpace space="medium" />
      <Button fullWidth onClick={handleCloseButtonClick}>
        Close Plugin
      </Button>
    </Container>
  );
}

// Function to copy text from an element by its ID
function copyToClipboard(elementId: string) {
  const text = document.getElementById(elementId)?.textContent || "";
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  alert("Copied to clipboard");
}

export default render(Plugin);