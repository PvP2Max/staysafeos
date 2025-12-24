/**
 * Parse AAMVA PDF417 barcode data from driver's licenses
 * AAMVA = American Association of Motor Vehicle Administrators
 */

export interface AAMVAData {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  fullAddress?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
}

/**
 * Parse AAMVA PDF417 barcode data
 * Format: Data elements are separated by line feeds, each starting with a 3-letter code
 */
export function parseAAMVA(data: string): AAMVAData | null {
  try {
    // AAMVA data elements - common codes
    const elements: Record<string, string> = {};

    // Split by various line endings
    const lines = data.split(/[\n\r]+/);

    for (const line of lines) {
      if (line.length >= 3) {
        const code = line.substring(0, 3);
        const value = line.substring(3).trim();
        if (value) {
          elements[code] = value;
        }
      }
    }

    // Extract fields using AAMVA element IDs
    // DAC = First Name, DCS = Last Name, DAD = Middle Name
    // DCT = First Name (alternate), DCS = Family Name
    // DAG = Street Address, DAI = City, DAJ = State, DAK = ZIP
    // DBB = Date of Birth (MMDDYYYY), DAQ = License Number

    const firstName = elements['DAC'] || elements['DCT'] || '';
    const lastName = elements['DCS'] || elements['DAB'] || '';
    const middleName = elements['DAD'] || elements['DDG'] || '';

    // If we have a full name field (DAA), parse it
    let fullName = '';
    if (elements['DAA']) {
      fullName = elements['DAA'].replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    }

    // If we didn't get names, try to parse from full name
    let parsedFirst = firstName;
    let parsedLast = lastName;
    if (!parsedFirst && !parsedLast && fullName) {
      const parts = fullName.split(' ');
      if (parts.length >= 2) {
        parsedFirst = parts[0];
        parsedLast = parts[parts.length - 1];
      }
    }

    if (!parsedFirst && !parsedLast) {
      return null;
    }

    const address = elements['DAG'] || '';
    const city = elements['DAI'] || '';
    const state = elements['DAJ'] || '';
    let zip = elements['DAK'] || '';

    // Clean up ZIP (remove trailing zeros sometimes present)
    if (zip.length > 5) {
      zip = zip.substring(0, 5) + (zip.length > 5 ? '-' + zip.substring(5, 9) : '');
    }

    // Build full address
    const addressParts = [address];
    if (city || state || zip) {
      addressParts.push([city, state, zip].filter(Boolean).join(', '));
    }
    const fullAddress = addressParts.filter(Boolean).join(', ');

    return {
      firstName: parsedFirst,
      middleName: middleName || undefined,
      lastName: parsedLast,
      fullName: fullName || `${parsedFirst} ${parsedLast}`.trim(),
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zip: zip || undefined,
      fullAddress: fullAddress || undefined,
      dateOfBirth: elements['DBB'] || undefined,
      licenseNumber: elements['DAQ'] || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Try to parse CAC (Common Access Card) data
 * CAC barcodes contain DoD ID and name information
 */
export function parseCAC(data: string): { name: string } | null {
  try {
    // CAC PDF417 contains name data - format varies
    // Common patterns include name fields separated by specific delimiters

    // Try common CAC patterns
    // Pattern 1: Name in specific position after header
    const lines = data.split(/[\n\r]+/);

    for (const line of lines) {
      // Look for name-like patterns (Last, First or First Last)
      if (/^[A-Z][a-zA-Z]+[\s,]+[A-Z][a-zA-Z]+/.test(line)) {
        return { name: line.replace(/,/g, ' ').replace(/\s+/g, ' ').trim() };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Auto-detect and parse ID barcode data
 */
export function parseIDBarcode(data: string): AAMVAData | null {
  // Try AAMVA format first (most common for DL)
  const aamva = parseAAMVA(data);
  if (aamva) {
    return aamva;
  }

  // Try CAC format
  const cac = parseCAC(data);
  if (cac) {
    return {
      firstName: '',
      lastName: '',
      fullName: cac.name,
    };
  }

  return null;
}
