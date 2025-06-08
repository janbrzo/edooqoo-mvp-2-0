
// Enhanced deep fix for {text} objects
export const deepFixTextObjects = (obj: any, path: string = 'root'): any => {
  console.log(`🔧 Checking path: ${path}, type: ${typeof obj}`);
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // If it's a primitive, return as-is
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Special case: {text: "something"} object
  if (typeof obj === 'object' && obj.hasOwnProperty('text') && Object.keys(obj).length === 1) {
    console.log(`🔧 FIXED {text} object at ${path}:`, obj, '→', obj.text);
    return obj.text;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item, index) => deepFixTextObjects(item, `${path}[${index}]`));
  }
  
  // Handle regular objects
  const fixed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    fixed[key] = deepFixTextObjects(value, `${path}.${key}`);
  }
  
  return fixed;
};
