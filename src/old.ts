// This plugin will open a tab that indicates that it will monitor the current
// selection on the page. It cannot change the document itself.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { themeColors: true, /* other options */ });

interface VariableInfo {
  name: string;
  type: string;
  nodeName: string;
}

let parseTextStyles = false;

figma.on('selectionchange', async () => {
  const selection = figma.currentPage.selection;
  if (selection.length > 0) {
    const variables = await getAllVariables(selection);
    figma.ui.postMessage({ type: 'variables', data: variables });
  } else {
    figma.ui.postMessage({ type: 'variables', data: [] });
  }
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'toggleParseTextStyles') {
    parseTextStyles = msg.value;
    const selection = figma.currentPage.selection;
    if (selection.length > 0) {
      const variables = await getAllVariables(selection);
      figma.ui.postMessage({ type: 'variables', data: variables });
    }
  }
};

function isAsset(node: SceneNode): boolean {
  // Check if the node has the isAsset property set to true
  return 'isAsset' in node && node.isAsset === true;
}

function isComponentOrInstance(node: SceneNode): node is ComponentNode | InstanceNode {
  // Check if the node is a component or an instance of a component
  return node.type === 'COMPONENT' || node.type === 'INSTANCE';
}

async function getAllVariables(nodes: readonly SceneNode[]): Promise<VariableInfo[]> {
  const variables: VariableInfo[] = [];

  async function extractVariables(node: SceneNode) {
    if (isAsset(node)) return;

    // Track variables at the node level to avoid duplicates within the same node
    const nodeSeenVariables = new Set<string>();

    // Check boundVariables
    if ('boundVariables' in node) {
      const boundVars = node.boundVariables;
      if (boundVars) {
        const typedBoundVars = boundVars as { [key: string]: VariableAlias | undefined };
        for (const key in typedBoundVars) {
          const varAlias = typedBoundVars[key];
          if (varAlias?.type === 'VARIABLE_ALIAS') {
            await addVariable(varAlias.id, key, node.name, node.type);
          }
        }
      }
    }

    // Check fill
    if ('fills' in node && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.boundVariables?.color) {
          await addVariable(fill.boundVariables.color.id, 'fill', node.name, node.type);
        }
      }
    }

    // Check stroke
    if ('strokes' in node && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes) {
        if (stroke.type === 'SOLID' && stroke.boundVariables?.color) {
          await addVariable(stroke.boundVariables.color.id, 'stroke', node.name, node.type);
        }
      }
    }

    // Check text properties
    if (node.type === 'TEXT') {
      console.log('TEXT node detected:', node);

      if (parseTextStyles) {
        // Parse text styles if enabled and skip text variables
        const textStyleId = node.textStyleId;
        // console.log('Text style ID:', textStyleId, 'Type:', typeof textStyleId);

        // console.log(`1. Text style ID for node ${node.name}:`, textStyleId);
        
        if (textStyleId && textStyleId !== figma.mixed) {
          // console.log(`2. Text style ID for node ${node.name}:`, textStyleId);
          // console.log(`Attempting to retrieve style for textStyleId: ${textStyleId}`);
          const textStyle = await figma.getStyleByIdAsync(textStyleId);
          console.log(`Retrieved text style for ID ${textStyleId}:`, textStyle);
          if (textStyle) {
            const baseStyleName = textStyle.name;
            // console.log(`textStyle.name ${baseStyleName}`);
            // console.log('node.name', node.name)
            await addVariable(`${baseStyleName}/font/size`, `Font Size`, node.name, node.type);
            await addVariable(`${baseStyleName}/line/height`,`Line Height`,  node.name, node.type);
            await addVariable(`${baseStyleName}/font/weight`, `Font Weight`, node.name, node.type);
          }
        }
      } else {
        // Parse bound text variables if text styles are not enabled
        console.log('node.boundVariables:', node.boundVariables);

        if (node.boundVariables) {
          const textProps = ['fontSize', 'fontName', 'letterSpacing', 'lineHeight', 'paragraphSpacing', 'textCase', 'textDecoration'] as const;

          for (const prop of textProps) {
            // Casting boundVariables to an indexable type
            const varAliases = (node.boundVariables as { [key: string]: VariableAlias[] })[prop];

            if (Array.isArray(varAliases)) {
              for (const varAlias of varAliases) {
                // console.log(`varAlias for ${prop}:`, varAlias);

                if (varAlias && varAlias.type === 'VARIABLE_ALIAS' && !nodeSeenVariables.has(varAlias.id)) {
                  const variable = await figma.variables.getVariableByIdAsync(varAlias.id);
                  if (variable) {
                    nodeSeenVariables.add(varAlias.id);
                    await addVariable(varAlias.id, `text/${prop}`, variable.name, node.type);
                  } else {
                    console.error('Variable not found for ID:', varAlias.id);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Recursively check children
    if ('children' in node) {
      for (const child of node.children) {
        await extractVariables(child);
      }
    }
  }

  async function addVariable(id: string, type: string, nodeName: string, nodeType: string) {
    try {
      if (parseTextStyles && nodeType === 'TEXT' && (type.startsWith('Font') || type.startsWith('Line'))) {
        // If parseTextStyles is true and the node is of type 'TEXT', use the ID directly as the name
        variables.push({
          name: id, // Use the provided name (which is actually the text style name)
          type: type,
          nodeName: nodeName,
        });
      } else {
        // Otherwise, treat id as an ID and fetch the variable
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

// Initial selection handling
if (figma.currentPage.selection.length > 0) {
  getAllVariables(figma.currentPage.selection).then((variables) => {
    figma.ui.postMessage({ type: 'variables', data: variables });
  });
}