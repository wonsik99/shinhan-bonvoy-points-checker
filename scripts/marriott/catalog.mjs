import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const COUNTRY_FILE_PATTERN = /^[a-z]{2}\.ts$/;
const PROPERTY_CODE_PATTERN = /^[A-Z0-9]{4,8}$/;
const PREFIXED_PROPERTY_COUNTRIES = new Set([
  "AU",
  "CN",
  "ID",
  "IN",
  "JP",
  "MY",
  "PH",
  "SG",
  "TH",
  "TW",
  "US",
  "VN",
]);

function getStringProperty(node, propertyName) {
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    const name = property.name.getText().replaceAll(/^["']|["']$/g, "");
    if (name !== propertyName || !ts.isStringLiteralLike(property.initializer)) {
      continue;
    }

    return property.initializer.text;
  }

  return null;
}

function getStringArrayProperty(node, propertyName) {
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }
    const name = property.name.getText().replaceAll(/^["']|["']$/g, "");
    if (
      name !== propertyName ||
      !ts.isArrayLiteralExpression(property.initializer)
    ) {
      continue;
    }
    return property.initializer.elements
      .filter(ts.isStringLiteralLike)
      .map((element) => element.text);
  }
  return [];
}

function localPropertyId(country, rawId, officialName) {
  if (rawId) {
    return PREFIXED_PROPERTY_COUNTRIES.has(country)
      ? `${country.toLowerCase()}-${rawId.toLowerCase()}`
      : rawId;
  }

  const slug = officialName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${country.toLowerCase()}-${slug}`;
}

function sourceLocation(sourceFile, node) {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return line + 1;
}

function extractCountryFileCatalog(filePath, country, sourceText) {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const records = [];
  const seenNodes = new Set();

  function addRecord({
    rawId = null,
    explicitPropertyCode = null,
    formerPropertyCodes = [],
    officialName,
    node,
  }) {
    const identity = `${rawId ?? ""}\u0000${officialName}`;
    if (seenNodes.has(identity)) {
      return;
    }
    seenNodes.add(identity);

    records.push({
      localId: localPropertyId(country, rawId, officialName),
      propertyCode:
        explicitPropertyCode && PROPERTY_CODE_PATTERN.test(explicitPropertyCode)
          ? explicitPropertyCode
          : rawId && PROPERTY_CODE_PATTERN.test(rawId)
            ? rawId
            : null,
      formerPropertyCodes,
      country,
      officialName,
      sourceFile: path.relative(process.cwd(), filePath),
      sourceLine: sourceLocation(sourceFile, node),
    });
  }

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const rawId = getStringProperty(node, "id");
      const explicitPropertyCode = getStringProperty(node, "propertyCode");
      const formerPropertyCodes = getStringArrayProperty(
        node,
        "formerPropertyCodes"
      );
      const officialName = getStringProperty(node, "officialName");
      if (rawId && officialName) {
        addRecord({
          rawId,
          explicitPropertyCode,
          formerPropertyCodes,
          officialName,
          node,
        });
      }
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "korea" &&
      node.arguments.length >= 2 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ts.isStringLiteralLike(node.arguments[1])
    ) {
      addRecord({
        rawId: node.arguments[0].text,
        officialName: node.arguments[1].text,
        node,
      });
    }

    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      /officialnames$/i.test(node.name.text) &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const element of node.initializer.elements) {
        if (ts.isStringLiteralLike(element)) {
          addRecord({ officialName: element.text, node: element });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return records;
}

export async function loadLocalMarriottCatalog(projectRoot = process.cwd()) {
  const directory = path.join(projectRoot, "rules", "marriottProperties");
  const fileNames = (await readdir(directory))
    .filter((fileName) => COUNTRY_FILE_PATTERN.test(fileName))
    .sort();
  const records = [];

  for (const fileName of fileNames) {
    const filePath = path.join(directory, fileName);
    const sourceText = await readFile(filePath, "utf8");
    records.push(
      ...extractCountryFileCatalog(
        filePath,
        path.basename(fileName, ".ts").toUpperCase(),
        sourceText
      )
    );
  }

  const overridePath = path.join(
    projectRoot,
    "data",
    "marriott",
    "property-code-overrides.json"
  );
  const propertyCodeOverrides = JSON.parse(await readFile(overridePath, "utf8"));
  const recordsById = new Map(records.map((record) => [record.localId, record]));

  for (const [localId, propertyCode] of Object.entries(propertyCodeOverrides)) {
    const record = recordsById.get(localId);
    if (!record) {
      throw new Error(`Unknown Marriott property-code override: ${localId}`);
    }
    if (!PROPERTY_CODE_PATTERN.test(propertyCode)) {
      throw new Error(`Invalid Marriott property code for ${localId}: ${propertyCode}`);
    }
    record.propertyCode = propertyCode;
  }

  return records.sort((left, right) =>
    left.localId.localeCompare(right.localId, "en")
  );
}

export function findDuplicateLocalPropertyCodes(records) {
  const owners = new Map();
  const duplicates = [];

  for (const record of records) {
    for (const propertyCode of [
      ...(record.propertyCode ? [record.propertyCode] : []),
      ...(record.formerPropertyCodes ?? []),
    ]) {
      const owner = owners.get(propertyCode);
      if (owner) {
        duplicates.push({
          propertyCode,
          first: owner,
          duplicate: record,
        });
      } else {
        owners.set(propertyCode, record);
      }
    }
  }

  return duplicates;
}
