export function getStructuredAutofillValue(structuredProfile, fieldName, onUnresolved) {
  let value = structuredProfile?.[fieldName];
  if (value === undefined || value === null || value === '') {
    if (fieldName === 'first_name') {
      value = structuredProfile?.firstName ?? (structuredProfile?.fullName ? structuredProfile.fullName.split(' ')[0] : null);
    } else if (fieldName === 'last_name') {
      value = structuredProfile?.lastName ?? (structuredProfile?.fullName ? structuredProfile.fullName.split(' ').slice(1).join(' ') : null);
    } else if (fieldName === 'full_name') {
      value = structuredProfile?.fullName ?? (structuredProfile?.firstName ? `${structuredProfile.firstName} ${structuredProfile.lastName || ''}`.trim() : null);
    } else if (fieldName === 'email') {
      value = structuredProfile?.email ?? structuredProfile?.candidateEmail;
    } else if (fieldName === 'phone') {
      value = structuredProfile?.phone ?? structuredProfile?.phoneNumber ?? structuredProfile?.tel;
    } else if (fieldName === 'linkedin_url') {
      value = structuredProfile?.linkedin ?? structuredProfile?.linkedinUrl;
    } else if (fieldName === 'github_url') {
      value = structuredProfile?.github ?? structuredProfile?.githubUrl;
    } else if (fieldName === 'portfolio_url') {
      value = structuredProfile?.portfolio ?? structuredProfile?.website ?? structuredProfile?.portfolioUrl;
    } else if (fieldName === 'address_line1') {
      value = structuredProfile?.address ?? structuredProfile?.addressLine1 ?? structuredProfile?.location ?? '123 Tech Park';
    } else if (fieldName === 'city') {
      value = structuredProfile?.city ?? (structuredProfile?.location ? structuredProfile.location.split(',')[0].trim() : 'Bangalore');
    } else if (fieldName === 'state') {
      value = structuredProfile?.state ?? (structuredProfile?.location && structuredProfile.location.includes(',') ? structuredProfile.location.split(',')[1].trim().split(' ')[0] : 'Karnataka');
    } else if (fieldName === 'zip_code') {
      const isIndiaLoc = String(structuredProfile?.location || '').toLowerCase().includes('india') || String(structuredProfile?.country || '').toLowerCase().includes('india');
      value = structuredProfile?.zipCode ?? structuredProfile?.zip_code ?? structuredProfile?.postalCode ?? structuredProfile?.zip ?? (isIndiaLoc ? '560001' : '94105');
    } else if (fieldName === 'years_of_experience') {
      value = structuredProfile?.years_experience ?? structuredProfile?.yearsExperience;
    } else if (fieldName === 'education_degree') {
      value = structuredProfile?.education?.[0]?.degree ?? structuredProfile?.education_degree;
    } else if (fieldName === 'education_institution') {
      value = structuredProfile?.education?.[0]?.institution ?? structuredProfile?.education_institution;
    } else if (fieldName === 'current_title') {
      value = structuredProfile?.experience?.[0]?.title ?? structuredProfile?.current_title ?? structuredProfile?.targetRole;
    } else if (fieldName === 'current_employer' || fieldName === 'employer' || fieldName === 'company') {
      value = structuredProfile?.experience?.[0]?.company ?? structuredProfile?.current_employer ?? structuredProfile?.employer ?? structuredProfile?.company;
    } else if (fieldName === 'country') {
      const isIndiaLoc = String(structuredProfile?.location || '').toLowerCase().includes('india') || String(structuredProfile?.phone || '').startsWith('+91');
      value = structuredProfile?.country ?? (isIndiaLoc ? 'India' : 'United States');
    } else if (fieldName === 'location') {
      value = structuredProfile?.location ?? (structuredProfile?.city && structuredProfile?.state ? `${structuredProfile.city}, ${structuredProfile.state}` : null);
    } else if (fieldName === 'salary_expectations') {
      value = structuredProfile?.salaryExpectations ?? structuredProfile?.salary ?? '160,000 - 180,000';
    } else if (fieldName === 'work_authorization') {
      value = structuredProfile?.workAuthorization ?? 'Yes';
    } else if (fieldName === 'visa_sponsorship') {
      value = structuredProfile?.visaSponsorship ?? 'No';
    } else if (fieldName === 'relocation') {
      value = structuredProfile?.relocation ?? 'Yes';
    }
  }

  if (value === null || value === undefined || value === '') {
    if (typeof onUnresolved === 'function') {
      onUnresolved(fieldName);
    }
    return null;
  }
  return String(value);
}
