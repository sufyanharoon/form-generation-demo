/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Convert a string value to uppercase
 * @name sanitizeUppercase Sanitize Uppercase
 * @param {string} value - Input string
 * @return {string}
 */
function sanitizeUppercase(value) {
  return value ? value.toUpperCase() : value;
}

/**
 * Sanitize middle name: trim spaces, collapse multiple interior spaces to one
 * @name sanitizeMiddleName Sanitize Middle Name
 * @param {string} value - Input string
 * @return {string}
 */
function sanitizeMiddleName(value) {
  if (!value) return value;
  return value.trim().replace(/  +/g, ' ');
}

/**
 * Calculate age in years and months from date-of-birth string (MM/DD/YYYY)
 * @name validateAge Validate Age
 * @param {string} dob - Date of birth in MM/DD/YYYY format
 * @return {object}
 */
function validateAge(dob) {
  const parts = dob.split('/');
  const birthMonth = parseInt(parts[0], 10);
  const birthYear = parseInt(parts[2], 10);
  const today = new Date();
  const ageYears = today.getFullYear() - birthYear;
  const monthDiff = (today.getMonth() + 1) - birthMonth;
  const totalMonths = (ageYears * 12) + monthDiff;
  return { years: ageYears, months: monthDiff, totalMonths };
}

/**
 * Validate that total experience does not exceed age
 * @name validateExperience Validate Experience
 * @param {number} expYears - Experience in years
 * @param {number} expMonths - Experience in months
 * @param {string} dob - Date of birth in MM/DD/YYYY format
 * @param {string} errorLabel - Error message to display if invalid
 * @param {scope} globals
 * @return {boolean}
 */
function validateExperience(expYears, expMonths, dob, errorLabel, globals) {
  const totalExpMonths = (parseInt(expYears, 10) * 12) + parseInt(expMonths, 10);
  const ageData = validateAge(dob);
  if (totalExpMonths > ageData.totalMonths) {
    globals.functions.markFieldAsInvalid('', errorLabel, { useId: false });
    return false;
  }
  return true;
}

/**
 * Validate KYC document number by regex per document type
 * @name validateKycDocNumber Validate KYC Document Number
 * @param {string} docNumber - Document number (auto-uppercased)
 * @param {string} docType - "50000" Passport | "50001" Driving License | "50002" Voter ID
 * @param {scope} globals
 * @return {boolean}
 */
function validateKycDocNumber(docNumber, docType, globals) {
  const patterns = {
    50000: { regex: /^[A-PR-WY][1-9][0-9]\s?[0-9]{4}[1-9]$/, msg: 'Invalid Passport Number' },
    50001: { regex: /^[A-Z]{2}[0-9]{2}(19|20)[0-9]{2}[0-9]{7}$/, msg: 'Invalid Driving License Number' },
    50002: { regex: /^[A-Z0-9]{9,10}$/, msg: 'Invalid Voter ID Number' },
  };
  const rule = patterns[docType];
  if (!rule) return true;
  if (!rule.regex.test(docNumber)) {
    globals.functions.markFieldAsInvalid('', rule.msg, { useId: false });
    return false;
  }
  return true;
}

/**
 * Validate average monthly income is in range (> 0 and < 500000)
 * @name validateAvgMonthlyIncome Validate Avg Monthly Income
 * @param {number} value - Income value entered
 * @param {scope} globals
 * @return {boolean}
 */
function validateAvgMonthlyIncome(value, globals) {
  if (!value || value <= 0) {
    globals.functions.markFieldAsInvalid('', 'Average monthly income should be greater than zero rupee', { useId: false });
    return false;
  }
  if (value >= 500000) {
    globals.functions.markFieldAsInvalid('', 'Average monthly income cannot be greater than or equal to 5 lakh rupee', { useId: false });
    return false;
  }
  return true;
}

/**
 * Validate gross annual salary is at least 25000
 * @name validateGrossAnnualSalary Validate Gross Annual Salary
 * @param {number} value - Salary value entered
 * @param {scope} globals
 * @return {boolean}
 */
function validateGrossAnnualSalary(value, globals) {
  if (!value || value < 25000) {
    globals.functions.markFieldAsInvalid('', 'Gross Salary cannot be less than \u20B9 25000', { useId: false });
    return false;
  }
  return true;
}

/**
 * Validate EMI does not exceed average monthly income (self-employed path)
 * @name validateEmiSelfEmployed Validate EMI Self-Employed
 * @param {number} emi - Current EMI value
 * @param {number} avgMonthlyIncome - Average monthly income
 * @param {scope} globals
 * @return {boolean}
 */
function validateEmiSelfEmployed(emi, avgMonthlyIncome, globals) {
  if (emi > avgMonthlyIncome) {
    globals.functions.markFieldAsInvalid('', 'EMI cannot be greater than Average Monthly Income', { useId: false });
    return false;
  }
  return true;
}

/**
 * Validate annual EMI does not exceed gross annual salary (salaried path)
 * @name validateEmiSalaried Validate EMI Salaried
 * @param {number} emi - Current monthly EMI value
 * @param {number} grossAnnualSalary - Gross annual salary
 * @param {scope} globals
 * @return {boolean}
 */
function validateEmiSalaried(emi, grossAnnualSalary, globals) {
  if ((emi * 12) > grossAnnualSalary) {
    globals.functions.markFieldAsInvalid('', 'EMI cannot be greater than Gross Salary', { useId: false });
    return false;
  }
  return true;
}

/**
 * Update PAN number required state based on employment type, ITR availability, and PAN availability
 * @name updatePanRequired Update PAN Required
 * @param {scope} globals - Globals object
 */
function updatePanRequired(globals) {
  const empType = globals.form.employment_panel.employment_type.$value;
  const itr = globals.form.employment_panel.self_employed_panel.itr_available.$value;
  const businessSection = globals.form.employment_panel.self_employed_panel.business_section;
  const panAvail = businessSection.pan_available.$value;

  const isRequired = empType === '440007'
    || empType === '440008'
    || (empType === '200002' && itr === '1')
    || (empType === '200002' && itr === '0' && panAvail === 'Yes');

  const panField = globals.form.personal_info_panel.pan_number;
  globals.functions.setProperty(panField, { required: isRequired });
}

// eslint-disable-next-line import/prefer-default-export
export {
  getFullName,
  days,
  submitFormArrayToString,
  sanitizeUppercase,
  sanitizeMiddleName,
  validateAge,
  validateExperience,
  validateKycDocNumber,
  validateAvgMonthlyIncome,
  validateGrossAnnualSalary,
  validateEmiSelfEmployed,
  validateEmiSalaried,
  updatePanRequired,
};
