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

// ── Plan 06: API Pre-fill ─────────────────────────────────

/**
 * Convert date string from YYYY-MM-DD to MM/DD/YYYY
 * @name convertDateToCalendarFormat Convert Date To Calendar Format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @return {string} Date string in MM/DD/YYYY format
 */
function convertDateToCalendarFormat(dateStr) {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

/**
 * Handle session timeout by clearing storage and redirecting or showing modal
 * @name handleSessionTimeout Handle Session Timeout
 * @param {string} journeyType - "customer" or "dealer"
 */
function handleSessionTimeout(journeyType) {
  if (journeyType === 'dealer') {
    sessionStorage.removeItem('dealer_data');
    sessionStorage.removeItem('fmp_enquiry_id');
    window.location.href = '/Finance/FinanceDealerSmartLogin';
  } else {
    sessionStorage.removeItem('fmp_enquiry_id');
    sessionStorage.removeItem('sfAssets');
    const modal = document.querySelector('.customer-relogin-modal');
    if (modal) modal.style.display = 'block';
  }
}

// Internal: detect session timeout from API response
function isSessionTimeout(response) {
  if (!response.ok) return response.status === 401;
  const body = response.body || {};
  const faultCode = body.fault && body.fault.code;
  return faultCode === 900901
    || faultCode === 900902
    || body.status === 'false'
    || !!body.Message;
}

// Internal: pre-fill all form fields from customer_data object
async function preFillFormHelper(customerData, globals) {
  const { form } = globals;
  const info = form.personal_info_panel;
  const emp = form.employment_panel;
  const se = emp.self_employed_panel;
  const sal = emp.salaried_panel;
  const common = form.common_fields_panel;

  const set = (field, val) => {
    if (field && val !== undefined && val !== null) {
      globals.functions.setProperty(field, { value: val });
    }
  };

  // Personal info
  set(info.first_name, customerData.first_name);
  set(info.middle_name, customerData.middle_name);
  set(info.last_name, customerData.last_name);
  set(info.mobile_number, customerData.mobile);
  set(info.email, customerData.email);
  set(info.dob, convertDateToCalendarFormat(customerData.dob));
  set(info.gender, customerData.gender);
  set(info.pan_number, customerData.pan_number);

  // Employment type (set first, then dispatch change to trigger visibility rules)
  set(emp.employment_type, customerData.employment_type);
  globals.functions.dispatchEvent(emp.employment_type, 'change');

  const empType = customerData.employment_type;

  if (empType === '200002') {
    // Self-employed fields
    const itrVal = customerData.pancard_available === 'Yes' ? '0' : '1';
    set(se.itr_available, itrVal);
    globals.functions.dispatchEvent(se.itr_available, 'change');

    if (itrVal === '1') {
      const prof = se.professional_section;
      set(prof.sub_employment_professional, customerData.sub_employment_id);
      set(prof.prof_exp_years, customerData.self_work_experience_in_years);
      set(prof.prof_exp_months, customerData.self_work_experience_in_months);
    } else {
      const biz = se.business_section;
      set(biz.sub_employment_business, customerData.sub_employment_id);
      set(biz.business_tenure_years, customerData.tenure_of_business_in_years);
      set(biz.business_tenure_months, customerData.tenure_of_business_in_months);
      set(biz.pan_available, customerData.pancard_available);
      globals.functions.dispatchEvent(biz.pan_available, 'change');

      if (customerData.pancard_available !== 'Yes') {
        set(se.kyc_section.kyc_document_type, customerData.kyc_document);
        set(se.kyc_section.kyc_document_number, customerData.kyc_document_id);
      }
      if (biz.farmer_section) {
        set(biz.farmer_section.no_of_dairy_cattle, customerData.no_of_dairy_cattle);
        set(biz.farmer_section.total_agri_land, customerData.total_agri_land);
      }
    }
    set(se.avg_monthly_income, customerData.avg_monthly_income);
  } else if (empType === '440007' || empType === '440008') {
    // Salaried fields
    set(sal.employer_name, customerData.employer);
    set(sal.other_employer_name, customerData.others_employer);
    set(sal.work_exp_years, customerData.work_experience_years);
    set(sal.work_exp_months, customerData.work_experience_months);
    set(sal.gross_annual_salary, customerData.annual_salary);
    set(sal.net_annual_income, customerData.net_annual_income);
  }

  // Common fields
  set(common.current_emi, customerData.current_emi);
  set(common.residence_type, customerData.residence_type);
  set(common.residing_since, customerData.residing_since);
}

/**
 * Pre-fill form fields from API customer_data response object
 * @name preFillForm Pre-Fill Form
 * @param {object} customerData - Customer data object from API response
 * @param {scope} globals - Globals object
 */
function preFillForm(customerData, globals) {
  preFillFormHelper(customerData, globals).catch((err) => {
    console.error('preFillForm error:', err);
  });
}

/**
 * Activate read-only mode: disable inputs, hide Save, auto-check disclaimers
 * @name activateReadOnlyMode Activate Read-Only Mode
 * @param {scope} globals - Globals object
 */
function activateReadOnlyMode(globals) {
  const { form } = globals;
  // Disable all panels
  globals.functions.setProperty(form.personal_info_panel, { enabled: false });
  globals.functions.setProperty(form.employment_panel, { enabled: false });
  globals.functions.setProperty(form.common_fields_panel, { enabled: false });
  // Hide Save, relabel Proceed
  globals.functions.setProperty(form.btn_save, { visible: false });
  globals.functions.setProperty(form.btn_proceed, { label: 'Next' });
  // Auto-check all disclaimers
  const d = form.disclaimers_panel;
  globals.functions.setProperty(d.disclaimer_terms, { value: 'true' });
  globals.functions.setProperty(d.disclaimer_cibil, { value: 'true' });
  globals.functions.setProperty(d.disclaimer_form60, { value: 'true' });
  globals.functions.setProperty(d.disclaimer_aadhaar, { value: 'true' });
}

// Internal: call CheckActiveEnquiry and handle response
async function loadCustomerJourney(globals) {
  const mobile = localStorage.getItem('user_number');
  if (!mobile) {
    window.location.href = '/login';
    return;
  }
  const response = await globals.functions.request({
    url: '/api/sitecore/TrvFmpApi/CheckActiveEnquiry',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { requestString: { mobile } },
  });

  if (isSessionTimeout(response)) {
    handleSessionTimeout('customer');
    return;
  }
  if (!response.ok) {
    const msg = (response.body || {}).error_message || 'Failed to load data';
    globals.functions.markFieldAsInvalid('', msg, { useId: false });
    return;
  }
  const data = response.body.dataEnquieyData || {};
  const customerData = data.customer_data || {};
  const enquiry = data.enquiry || {};

  preFillForm(customerData, globals);

  const advancedStatuses = ['10053', '10054', '10059', '10060'];
  if (advancedStatuses.includes(String(enquiry.status))) {
    globals.functions.setProperty(globals.form.btn_save, { visible: false });
  }
  if (enquiry.mspin) {
    activateReadOnlyMode(globals);
  }
  if (data.assets) {
    globals.functions.setVariable('sfAssets', data.assets);
  }
}

// Internal: call DealerCustomerData and handle response
async function loadDealerJourney(enquiryId, globals) {
  const response = await globals.functions.request({
    url: '/api/sitecore/FmpDealerAPI/DealerCustomerData',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { requestString: { enquiry_id: enquiryId } },
  });

  if (isSessionTimeout(response)) {
    handleSessionTimeout('dealer');
    return;
  }
  if (!response.ok) {
    handleSessionTimeout('dealer');
    return;
  }
  const data = response.body.customerData || {};
  const customerData = data.customer_data || {};
  const enquiry = data.enquiry || {};

  preFillForm(customerData, globals);

  if (enquiry.mspin) {
    if (enquiry.dealer_belongs === 'false') {
      window.location.href = '/Finance/DealerDashboard';
      return;
    }
    activateReadOnlyMode(globals);
  }
}

/**
 * Load form data on page load: detect journey type and call appropriate API
 * @name loadFormData Load Form Data
 * @param {scope} globals - Globals object
 */
function loadFormData(globals) {
  const dealerData = sessionStorage.getItem('dealer_data');
  const enquiryId = sessionStorage.getItem('fmp_enquiry_id');

  if (dealerData && enquiryId) {
    loadDealerJourney(enquiryId, globals).catch((err) => {
      console.error('Dealer journey error:', err);
      handleSessionTimeout('dealer');
    });
  } else {
    loadCustomerJourney(globals).catch((err) => {
      console.error('Customer journey error:', err);
      handleSessionTimeout('customer');
    });
  }
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
  convertDateToCalendarFormat,
  handleSessionTimeout,
  preFillForm,
  activateReadOnlyMode,
  loadFormData,
};
