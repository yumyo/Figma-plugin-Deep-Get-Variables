import {
  Columns,
  Text,
  Button,
  Container,
  render,
  TextboxMultiline,
  Textbox,
  VerticalSpace,
  Checkbox,
  Tabs,
  TabsOption,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h, JSX, Fragment } from "preact";
import { useCallback, useState, useEffect } from "preact/hooks";
import { VariableUpdateHandler } from "./types";

import CopyButton from "./CopyButton";

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
  const [transformNames, setTransformNames] = useState(true);
  const [androidFormat, setAndroidFormat] = useState("");
  const [iosFormat, setIosFormat] = useState("");
  const [cssFormat, setCssFormat] = useState(""); // Added state for CSS format
  const [tabValue, setTabValue] = useState<string>("Android"); // Default tab

  useEffect(() => {
    const handleMessages = (event: MessageEvent) => {
      const { pluginMessage } = event.data;
      if (pluginMessage.type === "variables") {
        setVariables(pluginMessage.data);
        if (transformNames) {
          transformAndDisplay(pluginMessage.data);
        }
      }
      if (pluginMessage.type === "transformedVariableNames") {
        const { androidFormat, iosFormat, cssFormat } = pluginMessage.data;
        setAndroidFormat(androidFormat.join("\n"));
        setIosFormat(iosFormat.join("\n"));
        setCssFormat(cssFormat.join("\n"));
      }
    };

    window.addEventListener("message", handleMessages);
    window.parent.postMessage({ pluginMessage: { type: "getSelection" } }, "*");

    return () => window.removeEventListener("message", handleMessages);
  }, [transformNames]);

  useEffect(() => {
    // Send parseTextStyles state to the plugin controller
    window.parent.postMessage(
      { pluginMessage: { type: "toggleParseTextStyles", value: parseTextStyles } },
      "*"
    );
  }, [parseTextStyles]);

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

  const transformAndDisplay = useCallback(
    (variableNames: VariableInfo[]) => {
      const names = variableNames.map((variable) => variable.name);
      window.parent.postMessage(
        { pluginMessage: { type: "transformVariableNames", data: { variableNames: names, prefix } } },
        "*"
      );
    },
    [prefix]
  );

  useEffect(() => {
    transformAndDisplay(variables);
  }, [variables, prefix, transformNames, parseTextStyles]);

  // Define tab options
  const options: Array<TabsOption> = [
    { value: "Android", children: "" },
    { value: "iOS", children: "" },
    { value: "CSS", children: "" },
  ];

  // Handle tab change
  function handleTabChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    setTabValue(event.currentTarget.value);
  }

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
      <Columns space="small" style={{ alignItems: "baseline" }}>
        <h3 className="mr-1">Variables</h3>
        <CopyButton content={variables.map((variable) => variable.name).join("\n")} />
      </Columns>
      <pre
        id="variable-list"
        style={{ backgroundColor: "var(--figma-color-bg-secondary)", padding: "0.5rem 1rem" }}
      >
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
          <TextboxMultiline onInput={handleCustomTextChange} value={customText} />
        </>
      )}
      <VerticalSpace space="medium" />
      {transformNames && (
        <div id="transformOptions">
          <VerticalSpace space="medium" />
          <Text>Prefix:</Text>
          <VerticalSpace space="medium" />
          <Textbox
            value={prefix}
            onInput={handlePrefixChange}
            variant="border"
            placeholder="Add your prefix here"
          />
          <VerticalSpace space="medium" />
          <Tabs onChange={handleTabChange} options={options} value={tabValue} />
          <VerticalSpace space="medium" />
          {tabValue === "Android" && (
            <div>
              <pre id="androidFormat" style={{ backgroundColor: "var(--figma-color-bg-secondary)", padding: "0.5rem 1rem" }}>
                {androidFormat}
              </pre>
              <CopyButton content={androidFormat} />
            </div>
          )}
          {tabValue === "iOS" && (
            <div>
              <pre id="iosFormat" style={{ backgroundColor: "var(--figma-color-bg-secondary)", padding: "0.5rem 1rem" }}>
                {iosFormat}
              </pre>
              <CopyButton content={iosFormat} />
            </div>
          )}
          {tabValue === "CSS" && (
            <div>
              <pre id="cssFormat" style={{ backgroundColor: "var(--figma-color-bg-secondary)", padding: "0.5rem 1rem" }}>
                {cssFormat}
              </pre>
              <CopyButton content={cssFormat} />
            </div>
          )}
        </div>
      )}
      <VerticalSpace space="medium" />
    </Container>
  );
}

export default render(Plugin);