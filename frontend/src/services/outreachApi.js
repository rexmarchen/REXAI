import apiClient from './apiClient'

const outreachApi = {
  searchContacts: (roleOrFilters, company, location) => {
    const params = new URLSearchParams()
    
    if (typeof roleOrFilters === 'object' && roleOrFilters !== null) {
      const f = roleOrFilters
      if (f.titles && f.titles.length) f.titles.forEach(t => params.append('titles', t))
      if (f.companyNames && f.companyNames.length) f.companyNames.forEach(c => params.append('companyNames', c))
      if (f.seniorities && f.seniorities.length) f.seniorities.forEach(s => params.append('seniorities', s))
      if (f.departments && f.departments.length) f.departments.forEach(d => params.append('departments', d))
      if (f.excludedTitleKeywords && f.excludedTitleKeywords.length) f.excludedTitleKeywords.forEach(k => params.append('excludedTitleKeywords', k))
      if (f.headcountRanges && f.headcountRanges.length) f.headcountRanges.forEach(h => params.append('headcountRanges', h))
      if (f.fundingStages && f.fundingStages.length) f.fundingStages.forEach(fs => params.append('fundingStages', fs))
      if (f.technologies && f.technologies.length) f.technologies.forEach(tch => params.append('technologies', tch))
      if (f.yearsInRole) params.append('yearsInRole', f.yearsInRole)
      if (f.companyMode) params.append('companyMode', f.companyMode)
      if (f.verifiedEmailOnly !== undefined) params.append('verifiedEmailOnly', String(f.verifiedEmailOnly))
      if (f.hasLinkedIn !== undefined) params.append('hasLinkedIn', String(f.hasLinkedIn))
      if (f.excludeExistingContacts !== undefined) params.append('excludeExistingContacts', String(f.excludeExistingContacts))
      if (f.excludeContactedDays !== undefined) params.append('excludeContactedDays', String(f.excludeContactedDays))
    } else {
      if (roleOrFilters) params.append('role', roleOrFilters)
      if (company) params.append('company', company)
      if (location) params.append('location', location)
    }

    return apiClient.get(`/outreach/search?${params.toString()}`)
  },

  generateDrafts: (contactIds) => {
    return apiClient.post('/outreach/draft', { contactIds })
  },

  sendCampaign: (payload) => {
    return apiClient.post('/outreach/send', payload)
  },

  getStats: () => {
    return apiClient.get('/outreach/stats', {
      params: { _t: Date.now() }
    })
  },

  getMailboxes: () => apiClient.get('/outreach/mailboxes'),

  getMailboxConnectUrl: (provider) => apiClient.get(`/outreach/mailboxes/${provider}/connect`)
}

export default outreachApi
