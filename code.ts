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

figma.on('selectionchange', async () => {
  const selection = figma.currentPage.selection;
  if (selection.length > 0) {
    const variables = await getAllVariables(selection);
    figma.ui.postMessage({ type: 'variables', data: variables });
  } else {
    figma.ui.postMessage({ type: 'variables', data: [] });
  }
});

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

    // Check boundVariables
    if ('boundVariables' in node) {
      const boundVars = node.boundVariables;
      if (boundVars) {
        const typedBoundVars = boundVars as { [key: string]: VariableAlias | undefined };
        for (const key in typedBoundVars) {
          const varAlias = typedBoundVars[key];
          if (varAlias?.type === 'VARIABLE_ALIAS') {
            await addVariable(varAlias.id, key, node.name);
          }
        }
      }
    }
  
    // Check fill
    if ('fills' in node && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.boundVariables?.color) {
          await addVariable(fill.boundVariables.color.id, 'fill', node.name);
        }
      }
    }
  
    // Check stroke
    if ('strokes' in node && Array.isArray(node.strokes)) {
      for (const stroke of node.strokes) {
        if (stroke.type === 'SOLID' && stroke.boundVariables?.color) {
          await addVariable(stroke.boundVariables.color.id, 'stroke', node.name);
        }
      }
    }
  
    // Check text properties
    if (node.type === 'TEXT') {
      const textProps = ['fontSize', 'fontName', 'letterSpacing', 'lineHeight', 'paragraphSpacing', 'textCase', 'textDecoration'] as const;
      for (const prop of textProps) {
        if (node.boundVariables && prop in node.boundVariables) {
          const varAlias = (node.boundVariables as any)[prop];
          if (varAlias && varAlias.type === 'VARIABLE_ALIAS') {
            await addVariable(varAlias.id, prop, node.name);
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

  async function addVariable(id: string, type: string, nodeName: string) {
    try {
      const variable = await figma.variables.getVariableByIdAsync(id);
      if (variable) {
        variables.push({
          name: variable.name,
          type: type,
          nodeName: nodeName
        });
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
  getAllVariables(figma.currentPage.selection).then(variables => {
    figma.ui.postMessage({ type: 'variables', data: variables });
  });
}