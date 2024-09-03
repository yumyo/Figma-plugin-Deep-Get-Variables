import { once, on, showUI } from "@create-figma-plugin/utilities";
import { CloseHandler, VariableUpdateHandler } from "./types";

// Define the interface for VariableInfo
interface VariableInfo {
  name: string;
  type: string;
  nodeName: string;
}

let parseTextStyles = false;

function isAsset(node: SceneNode): boolean {
  return "isAsset" in node && node.isAsset === true;
}

function isComponentOrInstance(node: SceneNode): node is ComponentNode | InstanceNode {
  return node.type === "COMPONENT" || node.type === "INSTANCE";
}

async function getMainComponentAsync(node: InstanceNode): Promise<ComponentNode | null> {
  return node.mainComponent || (await node.getMainComponentAsync());
}

async function getAllVariables(nodes: readonly SceneNode[]): Promise<Array<VariableInfo>> {
  const variables: Array<VariableInfo> = [];

  async function extractVariables(node: SceneNode) {
    if (isAsset(node)) return;

    const nodeSeenVariables = new Set<string>();

    if ("boundVariables" in node) {
      const boundVars = node.boundVariables as Record<string, VariableAlias | undefined>;
      if (boundVars) {
        for (const key in boundVars) {
          const varAlias = boundVars[key];
          if (varAlias?.type === "VARIABLE_ALIAS") {
            variables.push({
              name: varAlias.id,
              type: key,
              nodeName: node.name,
            });
          }
        }
      }
    }

    // Check fill
    if ("fills" in node && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === "SOLID" && fill.boundVariables?.color) {
          await addVariable(fill.boundVariables.color.id, "fill", node.name, node.type);
        }
      }
    }

    // Check stroke
    if ("strokes" in node && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes) {
        if (stroke.type === "SOLID" && stroke.boundVariables?.color) {
          await addVariable(stroke.boundVariables.color.id, "stroke", node.name, node.type);
        }
      }
    }

    // Check text properties
    if (node.type === "TEXT") {
      console.log("TEXT node detected:", node);

      if (parseTextStyles) {
        const textStyleId = node.textStyleId;

        if (textStyleId && textStyleId !== figma.mixed) {
          const textStyle = await figma.getStyleByIdAsync(textStyleId);
          console.log(`Retrieved text style for ID ${textStyleId}:`, textStyle);
          if (textStyle) {
            const baseStyleName = textStyle.name;
            await addVariable(`${baseStyleName}/font/size`, "Font Size", node.name, node.type);
            await addVariable(`${baseStyleName}/line/height`, "Line Height", node.name, node.type);
            await addVariable(`${baseStyleName}/font/weight`, "Font Weight", node.name, node.type);
          }
        }
      } else {
        console.log("node.boundVariables:", node.boundVariables);

        if (node.boundVariables) {
          const textProps = ['fontSize', 'fontName', 'letterSpacing', 'lineHeight', 'paragraphSpacing', 'textCase', 'textDecoration'] as const;

          for (const prop of textProps) {
            const varAliases = (node.boundVariables as { [key: string]: VariableAlias[] })[prop];

            if (Array.isArray(varAliases)) {
              for (const varAlias of varAliases) {
                if (varAlias && varAlias.type === "VARIABLE_ALIAS" && !nodeSeenVariables.has(varAlias.id)) {
                  const variable = await figma.variables.getVariableByIdAsync(varAlias.id);
                  if (variable) {
                    nodeSeenVariables.add(varAlias.id);
                    await addVariable(varAlias.id, `text/${prop}`, variable.name, node.type);
                  } else {
                    console.error("Variable not found for ID:", varAlias.id);
                  }
                }
              }
            }
          }
        }
      }
    }

    if ("children" in node) {
      for (const child of node.children) {
        await extractVariables(child);
      }
    }
  }

  async function addVariable(id: string, type: string, nodeName: string, nodeType: string) {
    try {
      if (parseTextStyles && nodeType === "TEXT" && (type.startsWith("Font") || type.startsWith("Line"))) {
        variables.push({
          name: id,
          type: type,
          nodeName: nodeName,
        });
      } else {
        const variable = await figma.variables.getVariableByIdAsync(id);
        if (variable) {
          variables.push({
            name: variable.name,
            type: type,
            nodeName: nodeName,
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching variable: ${error}`);
    }
  }

  for (const node of nodes) {
    await extractVariables(node);
  }

  return variables;
}

export default function () {
  on<VariableUpdateHandler>("VARIABLE_UPDATE", async function () {
    const selection = figma.currentPage.selection;
    if (selection.length > 0) {
      const variables = await getAllVariables(selection);
      figma.ui.postMessage({ type: "variables", data: variables });
    }
  });

  on<CloseHandler>("CLOSE", function () {
    figma.closePlugin();
  });

  figma.on("selectionchange", async () => {
    const selection = figma.currentPage.selection;
    if (selection.length > 0) {
      const variables = await getAllVariables(selection);
      figma.ui.postMessage({ type: "variables", data: variables });
    } else {
      figma.ui.postMessage({ type: "variables", data: [] });
    }
  });

  figma.ui.onmessage = async (msg) => {
    if (msg.type === "toggleParseTextStyles") {
      parseTextStyles = msg.value;
      const selection = figma.currentPage.selection;
      if (selection.length > 0) {
        const variables = await getAllVariables(selection);
        figma.ui.postMessage({ type: "variables", data: variables });
      }
    }
  };

  showUI({ height: 400, width: 600 }); // Adjust dimensions as necessary
}