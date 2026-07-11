export function parseFalSchema(openapiSchema) {
  if (!openapiSchema) return { input_schema: {}, fields: [], required_fields: [] };

  const paths = openapiSchema.paths || {};
  const postPath = Object.values(paths).find(p => p.post) || {};
  const requestBodySchema = postPath.post?.requestBody?.content?.["application/json"]?.schema || openapiSchema;

  // Resolve $ref to get actual properties
  const resolved = resolveRef(requestBodySchema, openapiSchema);
  const schema = resolved.properties ? resolved : {
    properties: openapiSchema.properties,
    required: openapiSchema.required,
  };

  return parseJsonSchema(schema);
}

function resolveRef(schema, rootSchema) {
  if (!schema || !schema.$ref) return schema;
  const refPath = schema.$ref.replace("#/", "").split("/");
  let current = rootSchema;
  for (const segment of refPath) {
    if (current && current[segment] !== undefined) {
      current = current[segment];
    } else {
      return schema;
    }
  }
  // Handle nested $ref (schema that itself references another)
  if (current.$ref) return resolveRef(current, rootSchema);
  return current;
}

function parseJsonSchema(schema) {
  const properties = schema.properties || {};
  const required = new Set(schema.required || []);
  const fields = [];

  for (const [key, prop] of Object.entries(properties)) {
    const field = parseProperty(key, prop, required.has(key));
    if (field) fields.push(field);
  }

  return {
    input_schema: schema,
    fields,
    required_fields: [...required].filter(r => r in properties),
  };
}

function parseProperty(name, prop, isRequired) {
  const type = prop.type || guessType(prop);
  const field = {
    name,
    type,
    label: prop.title || name,
    description: prop.description || "",
    required: isRequired,
    default: prop.default ?? null,
    nullable: prop.nullable || false,
    constraints: {},
  };

  if (type === "string" && prop.enum) {
    field.type = "select";
    field.options = prop.enum.map(v => ({ label: String(v), value: v }));
    return field;
  }

  if (type === "boolean") {
    field.type = "boolean";
    return field;
  }

  if (type === "integer" || type === "number") {
    field.type = "number";
    field.constraints = {
      minimum: prop.minimum,
      maximum: prop.maximum,
      multipleOf: prop.multipleOf,
    };
    if (prop.enum) {
      field.type = "select";
      field.options = prop.enum.map(v => ({ label: String(v), value: v }));
    }
    return field;
  }

  if (type === "string") {
    const format = prop.format || "";
    if (format === "uri" || format === "url" || name.includes("url") || name.includes("image_url") || name.includes("video_url")) {
      field.type = "url";
    } else if (format === "binary" || name.includes("file") || name.includes("upload")) {
      field.type = "file";
    } else if (name === "prompt" || name.includes("prompt")) {
      field.type = "textarea";
    } else {
      field.type = prop.maxLength && prop.maxLength > 100 ? "textarea" : "text";
    }
    field.constraints = {
      minLength: prop.minLength,
      maxLength: prop.maxLength,
      pattern: prop.pattern,
    };
    return field;
  }

  if (type === "array") {
    field.type = "array";
    field.itemType = prop.items?.type || "string";
    if (prop.items?.enum) {
      field.options = prop.items.enum.map(v => ({ label: String(v), value: v }));
    }
    field.constraints = {
      minItems: prop.minItems,
      maxItems: prop.maxItems,
    };
    return field;
  }

  if (type === "object") {
    field.type = "object";
    const nested = parseJsonSchema(prop);
    field.fields = nested.fields;
    return field;
  }

  field.type = "text";
  return field;
}

function guessType(prop) {
  if (prop.enum) return "string";
  if (prop.properties) return "object";
  if (prop.items) return "array";
  return "string";
}

export function generateSchemaHash(schema) {
  const normalized = JSON.stringify(schema, Object.keys(schema).sort());
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const chr = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function generatePriceHash(unitPrice, unit, currency) {
  return generateSchemaHash({ unitPrice, unit, currency });
}

export function buildFalPayload(schemaFields, userInput) {
  const payload = {};

  for (const field of schemaFields) {
    const val = userInput[field.name];
    if (val === undefined || val === null || val === "") {
      if (field.default !== null && field.default !== undefined) {
        payload[field.name] = field.default;
      }
      continue;
    }
    payload[field.name] = val;
  }

  return payload;
}
