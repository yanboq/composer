import {
  editorOperationsPatchValueSchema,
  type BrandProfile,
  type EditorDocument,
  type EditorNode,
  type EditorOperation,
} from "./schemas";

function textNode(text: string): EditorNode {
  return { type: "text", text };
}

function paragraphNode(text: string, className?: string, style?: string): EditorNode {
  return {
    type: "paragraph",
    attrs: {
      ...(className ? { class: className } : {}),
      ...(style ? { style } : {}),
    },
    content: [textNode(text)],
  };
}

export function brandHeaderNode(brand: BrandProfile): EditorNode {
  return paragraphNode(
    brand.name,
    "brand-header",
    `color: ${brand.accentColor}; font-family: ${brand.fontPreset}, Arial, sans-serif; font-weight: 800; margin-bottom: 18px;`,
  );
}

export function brandFooterText(brand: BrandProfile) {
  return `${brand.name} - ${brand.defaultFooter}`;
}

export function brandFooterNode(brand: BrandProfile): EditorNode {
  return paragraphNode(
    brandFooterText(brand),
    "brand-footer",
    "color: #667085; font-size: 12px; line-height: 1.6; margin-top: 24px;",
  );
}

function getNodeText(node: EditorNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return typeof node.text === "string" ? node.text : "";
  return (node.content ?? []).map(getNodeText).join("");
}

function hasClass(node: EditorNode | undefined, className: string) {
  const raw = node?.attrs?.class;
  return typeof raw === "string" && raw.split(/\s+/).includes(className);
}

function editableContentRef(document: EditorDocument): EditorNode[] {
  const content = document.content as EditorNode[];
  const nonGlobal = content.filter((node) => node.type !== "globalContent");
  if (nonGlobal.length === 1 && nonGlobal[0]?.type === "container") {
    nonGlobal[0].content ??= [];
    return nonGlobal[0].content;
  }
  return content;
}

function updateTextLikeBrandNode(
  nodes: EditorNode[],
  className: "brand-header" | "brand-footer",
  nextNode: EditorNode,
  previousText?: string,
) {
  const index = nodes.findIndex((node) => {
    if (hasClass(node, className)) return true;
    const text = getNodeText(node).trim();
    return !!previousText && text === previousText.trim();
  });

  if (index >= 0) {
    nodes[index] = nextNode;
    return true;
  }

  return false;
}

export function ensureBrandStructure(
  document: EditorDocument,
  brand: BrandProfile,
  previousBrand?: Partial<BrandProfile>,
): EditorDocument {
  const next = structuredClone(document) as EditorDocument;
  next.content ??= [];
  const nodes = editableContentRef(next);

  const previousHeader = previousBrand?.name;
  const previousFooter =
    previousBrand?.name && previousBrand.defaultFooter
      ? `${previousBrand.name} - ${previousBrand.defaultFooter}`
      : undefined;

  if (!updateTextLikeBrandNode(nodes, "brand-header", brandHeaderNode(brand), previousHeader)) {
    nodes.unshift(brandHeaderNode(brand));
  }

  if (!updateTextLikeBrandNode(nodes, "brand-footer", brandFooterNode(brand), previousFooter)) {
    nodes.push(brandFooterNode(brand));
  }

  return next;
}

function getContentAtPath(root: EditorDocument | EditorNode, path: number[]) {
  let node: EditorDocument | EditorNode = root;
  for (const index of path) {
    const content = (node.content ?? []) as EditorNode[];
    if (index < 0 || index >= content.length) return null;
    node = content[index];
  }
  return (node.content ?? []) as EditorNode[];
}

function getNodeAtPath(root: EditorDocument | EditorNode, path: number[]) {
  let node: EditorDocument | EditorNode = root;
  for (const index of path) {
    const content = (node.content ?? []) as EditorNode[];
    if (index < 0 || index >= content.length) return null;
    node = content[index];
  }
  return node as EditorNode;
}

function replaceNodeAtPath(root: EditorDocument, path: number[], node: EditorNode) {
  if (path.length === 0) return;
  const parent = getContentAtPath(root, path.slice(0, -1));
  const index = path[path.length - 1];
  if (!parent || index >= parent.length) return;
  parent[index] = node;
}

function deleteNodeAtPath(root: EditorDocument, path: number[]) {
  if (path.length === 0) return null;
  const parent = getContentAtPath(root, path.slice(0, -1));
  const index = path[path.length - 1];
  if (!parent || index >= parent.length) return null;
  const [removed] = parent.splice(index, 1);
  return removed ?? null;
}

function insertNodeAtPath(root: EditorDocument, parentPath: number[], index: number, node: EditorNode) {
  const parent = getContentAtPath(root, parentPath);
  if (!parent) return;
  parent.splice(Math.min(index, parent.length), 0, node);
}

function setNodeText(node: EditorNode, text: string) {
  if (node.type === "text") {
    node.text = text;
    return;
  }
  node.content = [textNode(text)];
}

function applyEditorOperation(document: EditorDocument, operation: EditorOperation) {
  if (operation.type === "replaceNode") {
    replaceNodeAtPath(document, operation.path, operation.node);
  }

  if (operation.type === "insertNode") {
    insertNodeAtPath(document, operation.parentPath, operation.index, operation.node);
  }

  if (operation.type === "deleteNode") {
    deleteNodeAtPath(document, operation.path);
  }

  if (operation.type === "moveNode") {
    const node = deleteNodeAtPath(document, operation.fromPath);
    if (node) insertNodeAtPath(document, operation.toParentPath, operation.index, node);
  }

  if (operation.type === "setText") {
    const node = getNodeAtPath(document, operation.path);
    if (node) setNodeText(node, operation.text);
  }

  if (operation.type === "setAttrs") {
    const node = getNodeAtPath(document, operation.path);
    if (node) node.attrs = { ...(node.attrs ?? {}), ...operation.attrs };
  }
}

export function applyEditorOperationsToDocument(
  document: EditorDocument,
  value: unknown,
  brand: BrandProfile,
) {
  const parsed = editorOperationsPatchValueSchema.parse(value);
  let next = structuredClone(document) as EditorDocument;

  for (const operation of parsed.operations) {
    applyEditorOperation(next, operation);
  }

  next = ensureBrandStructure(next, brand);
  return next;
}

export function createEditorOutline(document: EditorDocument) {
  const rows: Array<{
    path: number[];
    type: string;
    text?: string;
    attrs?: Record<string, unknown>;
  }> = [];

  function visit(node: EditorNode, path: number[]) {
    if (node.type === "globalContent") return;
    rows.push({
      path,
      type: node.type,
      text: getNodeText(node).slice(0, 160) || undefined,
      attrs: node.attrs,
    });
    for (const [index, child] of (node.content ?? []).entries()) {
      visit(child, [...path, index]);
    }
  }

  for (const [index, node] of (document.content as EditorNode[]).entries()) {
    visit(node, [index]);
    if (rows.length > 80) break;
  }

  return rows.slice(0, 80);
}
