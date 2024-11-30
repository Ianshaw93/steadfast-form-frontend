'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Property, Contact } from '@/types/airtable';
import { MagnifyingGlassIcon as SearchIcon, XCircleIcon, PlusCircleIcon } from '@heroicons/react/24/solid';
import mockData from './mockData';

const mockSearchProperties = (query: string) => {
  const properties = mockData.data.Properties.filter(property => 
    property.fields.Address.toLowerCase().includes(query.toLowerCase()) ||
    property.fields["Post Code"].toLowerCase().includes(query.toLowerCase())
  );
  return { properties };
};

const mockGetPropertyDetails = (propertyId: string) => {
  const property = mockData.data.Properties.find(p => p.id === propertyId);
  if (!property) return null;

  const owner = mockData.data.Contacts.find(c => 
    property.fields["Owner ID"]?.includes(c.id)
  );
  
  const tenants = mockData.data.Tenants.filter(t => 
    property.fields["Tenant IDs"]?.includes(t.id)
  );

  return { property, owner, tenants };
};

const mockSearchOwners = (query: string) => {
  const owners = mockData.data.Contacts.filter(contact => 
    `${contact.fields["First Name"]} ${contact.fields["Last Name"]}`.toLowerCase().includes(query.toLowerCase()) ||
    contact.fields.Email.toLowerCase().includes(query.toLowerCase())
  );
  return { owners };
};

const mockSearchTenants = (query: string, existingTenants: Contact[]) => {
  const existingTenantIds = existingTenants.map(t => t.id);
  const filteredTenants = mockData.data.Tenants.filter(tenant => 
    !existingTenantIds.includes(tenant.id) && (
      `${tenant.fields["First Name"]} ${tenant.fields["Last Name"]}`.toLowerCase().includes(query.toLowerCase()) ||
      tenant.fields.Email.toLowerCase().includes(query.toLowerCase()) ||
      tenant.fields["Mobile Number"].toLowerCase().includes(query.toLowerCase())
    )
  );
  return { tenants: filteredTenants };
};

const getAccessTypeColor = (accessType: string) => {
  switch (accessType) {
    case 'key':
      return 'text-red-600';
    case 'tenant':
      return 'text-black';
    default:
      return 'text-gray-600';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-50 text-green-800 border-green-200';
    case 'Booked':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'Pending':
    case 'To Be Confirmed':
      return 'bg-red-50 text-red-800 border-red-200';
    default:
      return 'bg-gray-50 text-gray-800 border-gray-200';
  }
};

// Add this helper function for job type colors
const getJobTypeColor = (jobType: string) => {
  switch (jobType) {
    case 'Gas Safety Check':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Legionella Testing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Smoke, Heat, and CO Alarms Testing':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Electrical Safety Check':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'PAT Testing':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'EPC (Energy Performance Certificate)':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Lead and Water Testing':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'Boiler Maintenance and Pressure Checks':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function ComplianceCheckForm() {
  const [addressSearch, setAddressSearch] = useState('');
  const [debouncedAddress] = useDebounce(addressSearch, 300);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<{
    property: Property;
    owner: Contact;
    tenants: Contact[];
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [isNewProperty, setIsNewProperty] = useState(false);
  // @ts-ignore
  const [newPropertyData, setNewPropertyData] = useState({
    address: '',
    postCode: '',
  });
  // @ts-ignore
  const [ownerSearch, setOwnerSearch] = useState('');
  const [debouncedOwner] = useDebounce(ownerSearch, 300);
  // @ts-ignore
  const [filteredOwners, setFilteredOwners] = useState<Contact[]>([]);
  // @ts-ignore
  const [isNewOwner, setIsNewOwner] = useState(false);
  // @ts-ignore
  const [newOwnerData, setNewOwnerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
  });
  // @ts-ignore
  const [selectedOwner, setSelectedOwner] = useState<Contact | null>(null);
  // @ts-ignore
  const [tenantSearch, setTenantSearch] = useState('');
  const [debouncedTenant] = useDebounce(tenantSearch, 300);
  // @ts-ignore
  const [filteredTenants, setFilteredTenants] = useState<Contact[]>([]);
  // @ts-ignore
  const [isNewTenant, setIsNewTenant] = useState(false);
  // @ts-ignore
  const [newTenantData, setNewTenantData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    landline: '',
  });
  // @ts-ignore
  const [editingTenantIndex, setEditingTenantIndex] = useState<number | null>(null);
  // @ts-ignore
  const [tenants, setTenants] = useState<Contact[]>([]);
  const jobTypes = [
    "Gas Safety Check",
    "Legionella Testing",
    "Smoke, Heat, and CO Alarms Testing",
    "Electrical Safety Check",
    "PAT Testing",
    "EPC (Energy Performance Certificate)",
    "Lead and Water Testing",
    "Boiler Maintenance and Pressure Checks"
  ];
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([
    "Gas Safety Check",
    "Legionella Testing",
    "Smoke, Heat, and CO Alarms Testing",
    "Electrical Safety Check",
    "PAT Testing"
  ]);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [editedOwnerData, setEditedOwnerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    landline: '',
  });
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [notes, setNotes] = useState<string>('');
  // @ts-ignore
  const [isEditing, setIsEditing] = useState<string | null>(null);
  // @ts-ignore
  const [editData, setEditData] = useState<{
    jobTypes: string[];
    month: string;
    year: number;
    notes: string;
  }>({
    jobTypes: [],
    month: '',
    year: currentYear,
    notes: ''
  });
  const [showNewCheckForm, setShowNewCheckForm] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [debouncedCompany] = useDebounce(companySearch, 300);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const availableCompanies = [
    "Zone Lettings",
    "Happy Lets",
    "Charles White",
    "Western Lettings"
  ];

  useEffect(() => {
    if (debouncedCompany) {
      setShowCompanyDropdown(true);
    } else {
      setShowCompanyDropdown(false);
    }
  }, [debouncedCompany]);

  const handleJobTypeChange = (jobType: string) => {
    setSelectedJobTypes(prev =>
      prev.includes(jobType)
        ? prev.filter(j => j !== jobType)
        : [...prev, jobType]
    );
  };

  const handleEditOwner = (owner: Contact) => {
    setEditedOwnerData({
      firstName: owner.fields["First Name"],
      lastName: owner.fields["Last Name"],
      email: owner.fields.Email,
      mobile: owner.fields["Mobile Number"],
      landline: owner.fields["Landline Number"] || '',
    });
    // @ts-ignore
    setCompanySearch(owner.fields.Company === "None" ? "" : owner.fields.Company);
    setIsEditingOwner(true);
  };

  useEffect(() => {
    if (debouncedAddress.length > 1) {
      setIsLoading(true);
      const results = mockSearchProperties(debouncedAddress);
      setProperties(results.properties);
      setIsLoading(false);
    } else {
      setProperties([]);
    }
  }, [debouncedAddress]);

  useEffect(() => {
    if (selectedProperty) {
      setIsLoading(true);
      const details = mockGetPropertyDetails(selectedProperty.id);
      if (details) {
        // @ts-ignore
        setPropertyDetails(details);
        // @ts-ignore
        setTenants(details.tenants);
      }
      setIsLoading(false);
    }
  }, [selectedProperty]);

  useEffect(() => {
    if (debouncedOwner.length > 1) {
      setIsLoading(true);
      const results = mockSearchOwners(debouncedOwner);
      setFilteredOwners(results.owners);
      setIsLoading(false);
    } else {
      setFilteredOwners([]);
    }
  }, [debouncedOwner]);

  useEffect(() => {
    if (debouncedTenant.length > 1) {
      setIsLoading(true);
      const results = mockSearchTenants(debouncedTenant, tenants);
      // @ts-ignore
      setFilteredTenants(results.tenants);
      setIsLoading(false);
    } else {
      setFilteredTenants([]);
    }
  }, [debouncedTenant, tenants]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Property Compliance History
        </h2>

        {/* Property Search Section - Always visible */}
        <div className="space-y-4 mb-8">
          <label className="block text-sm font-medium text-gray-700">
            Property Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Start typing address..."
            />
            {addressSearch && (
              <button
                type="button"
                onClick={() => setAddressSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              </button>
            )}
          </div>

          {/* Property Search Results */}
          {addressSearch.length > 0 && (
            <div className="mt-1 bg-white shadow-lg rounded-md border border-gray-200">
              <ul className="max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                {properties.map((property) => (
                  <li
                    key={property.id}
                    onClick={() => {
                      setSelectedProperty(property);
                      setAddressSearch('');
                      setProperties([]);
                    }}
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                  >
                    <div className="flex items-center">
                      <span className="font-normal block truncate">
                        {property.fields.Address}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 ml-2">
                      {property.fields["Post Code"]}
                    </span>
                  </li>
                ))}
                <li
                  onClick={() => {
                    setIsNewProperty(true);
                    setAddressSearch('');
                    setProperties([]);
                    setNewPropertyData({ address: addressSearch, postCode: '' });
                  }}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 text-green-700"
                >
                  <div className="flex items-center">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    <span>Add new property: "{addressSearch}"</span>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {propertyDetails && (
          <div className="space-y-6">
            {/* Property Details - Always show */}
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-blue-900">Selected Property</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>{propertyDetails.property.fields.Address}</p>
                <p>{propertyDetails.property.fields["Post Code"]}</p>
                <p className="text-xs mt-1">ID: {propertyDetails.property.fields["Property ID"]}</p>
              </div>
            </div>

            {/* Owner Details Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Owner Details</h3>
                {!propertyDetails?.owner && (
                  <button
                    onClick={() => setIsNewOwner(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 hover:text-blue-800"
                  >
                    <PlusCircleIcon className="h-5 w-5 mr-1" />
                    Add New Owner
                  </button>
                )}
              </div>

              {/* Current Owner Display */}
              {propertyDetails?.owner && !isEditingOwner && (
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      {/* @ts-ignore */}
                      {propertyDetails.owner.fields.Company !== "None" && (
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {/* @ts-ignore */}
                          {propertyDetails.owner.fields.Company}
                        </p>
                      )}
                      <p className="font-medium">
                        {propertyDetails.owner.fields["First Name"]} {propertyDetails.owner.fields["Last Name"]}
                      </p>
                      <p className="text-sm text-gray-500">{propertyDetails.owner.fields.Email}</p>
                      <p className="text-sm text-gray-500">{propertyDetails.owner.fields["Mobile Number"]}</p>
                      <p className="text-sm text-gray-600">
                        {propertyDetails.owner.fields.Role}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditOwner(propertyDetails.owner)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}

              {/* Edit Owner Form */}
              {propertyDetails?.owner && isEditingOwner && (
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <div className="space-y-4">
                    {/* Company Field */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={companySearch}
                          onChange={(e) => {
                            setCompanySearch(e.target.value);
                            // @ts-ignore
                            setEditedOwnerData({ ...editedOwnerData, company: e.target.value });
                          }}
                          onFocus={() => setShowCompanyDropdown(true)}
                          className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Search or enter company name..."
                        />
                        {companySearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setCompanySearch('');
                              setEditedOwnerData({ ...editedOwnerData, company: '' });
                            }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                          </button>
                        )}
                      </div>

                      {/* Company Search Results */}
                      {showCompanyDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200">
                          <ul className="max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                            {availableCompanies
                              .filter(company => 
                                company.toLowerCase().includes(companySearch.toLowerCase())
                              )
                              .map((company) => (
                                <li
                                  key={company}
                                  onClick={() => {
                                    setCompanySearch(company);
                                    // @ts-ignore
                                    setEditedOwnerData({ ...editedOwnerData, company });
                                    setShowCompanyDropdown(false);
                                  }}
                                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                                >
                                  <span className="block truncate">{company}</span>
                                </li>
                              ))}
                            {companySearch && !availableCompanies.some(company => 
                              company.toLowerCase() === companySearch.toLowerCase()
                            ) && (
                              <li
                                onClick={() => {
                                  // Keep the custom company name
                                  // @ts-ignore
                                  setEditedOwnerData({ ...editedOwnerData, company: companySearch });
                                  setShowCompanyDropdown(false);
                                }}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 text-green-700"
                              >
                                <div className="flex items-center">
                                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                                  {/* @ts-ignore */}
                                  <span>Add new company: "{companySearch}"</span>
                                </div>
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* First Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={editedOwnerData.firstName}
                        onChange={(e) => setEditedOwnerData({ ...editedOwnerData, firstName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Last Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={editedOwnerData.lastName}
                        onChange={(e) => setEditedOwnerData({ ...editedOwnerData, lastName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Role Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select
                        // @ts-ignore
                        value={editedOwnerData.role}
                        // @ts-ignore
                        onChange={(e) => setEditedOwnerData({ ...editedOwnerData, role: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="Private Landlord">Private Landlord</option>
                        <option value="Letting Agent">Letting Agent</option>
                      </select>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={editedOwnerData.email}
                        onChange={(e) => setEditedOwnerData({ ...editedOwnerData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Mobile Number Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                      <input
                        type="tel"
                        value={editedOwnerData.mobile}
                        onChange={(e) => setEditedOwnerData({ ...editedOwnerData, mobile: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsEditingOwner(false)}
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (propertyDetails?.owner) {
                            const updatedOwner = {
                              ...propertyDetails.owner,
                              fields: {
                                ...propertyDetails.owner.fields,
                                "First Name": editedOwnerData.firstName,
                                "Last Name": editedOwnerData.lastName,
                                // @ts-ignore
                                "Role": editedOwnerData.role,
                                // @ts-ignore
                                "Company": editedOwnerData.role === "Private Landlord" ? "None" : editedOwnerData.company,
                                "Email": editedOwnerData.email,
                                "Mobile Number": editedOwnerData.mobile
                              }
                            };
                            setPropertyDetails({
                              ...propertyDetails,
                              owner: updatedOwner
                            });
                          }
                          setIsEditingOwner(false);
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tenants Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tenant Details</h3>
                <button
                  onClick={() => setIsNewTenant(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 hover:text-blue-800"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-1" />
                  Add New Tenant
                </button>
              </div>

              {/* New Tenant Search - Only shows when adding new */}
              {isNewTenant && (
                <div className="mb-4 bg-white p-4 rounded-md shadow-sm">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={tenantSearch}
                      onChange={(e) => setTenantSearch(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Search for tenant by name, email, or phone..."
                    />
                  </div>

                  {/* Search Results */}
                  {tenantSearch.length > 0 && filteredTenants.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md">
                      <ul className="max-h-60 rounded-md py-1 text-base overflow-auto">
                        {filteredTenants.map((tenant) => (
                          <li
                            key={tenant.id}
                            onClick={() => {
                              setTenants([...tenants, tenant]);
                              setTenantSearch('');
                              setIsNewTenant(false);
                            }}
                            className="cursor-pointer py-2 px-3 hover:bg-blue-50"
                          >
                            <div className="flex justify-between">
                              <span>
                                {tenant.fields["First Name"]} {tenant.fields["Last Name"]}
                              </span>
                              <span className="text-sm text-gray-500">
                                {tenant.fields.Email}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setIsNewTenant(false)}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Existing Tenants List - Always visible */}
              <div className="space-y-4">
                {tenants.map((tenant, index) => (
                  <div key={tenant.id} className="bg-white p-4 rounded-md shadow-sm">
                    <div className="flex justify-between">
                      <div>
                        <p>{tenant.fields["First Name"]} {tenant.fields["Last Name"]}</p>
                        <p className="text-sm text-gray-500">{tenant.fields.Email}</p>
                        <p className="text-sm text-gray-500">{tenant.fields["Mobile Number"]}</p>
                      </div>
                      <button
                        onClick={() => {
                          const newTenants = tenants.filter(t => t.id !== tenant.id);
                          setTenants(newTenants);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance History */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance History</h3>
              {mockData.data["Compliance Checks"]
                .filter(check => check.fields["Property ID"].includes(propertyDetails.property.id))
                .length > 0 ? (
                <div className="space-y-4">
                  {mockData.data["Compliance Checks"]
                    .filter(check => check.fields["Property ID"].includes(propertyDetails.property.id))
                    .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
                    .map(check => (
                      <div 
                        key={check.id} 
                        className={`border rounded-md p-4 ${getStatusColor(check.fields.Status)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {check.fields["Inspection Month"]} {check.fields["Inspection Year"]}
                              </span>
                              <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(check.fields.Status)}`}>
                                {check.fields.Status}
                              </span>
                            </div>

                            {/* Access Type Indicator */}
                            <div className="mt-2">
                              {/* @ts-ignore */}
                              <span className={`text-sm font-medium ${getAccessTypeColor(check.fields.AccessType || 'tenant')}`}>
                                {/* @ts-ignore */}
                                {check.fields.AccessType === 'key' ? '🔑 Key Required' : '👤 Tenant Access'}
                              </span>
                            </div>

                            {/* Job Types */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {check.fields["Job Type"].map(job => (
                                <span 
                                  key={job} 
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getJobTypeColor(job)}`}
                                >
                                  {job}
                                </span>
                              ))}
                            </div>

                            {/* Notes with visual emphasis */}
                            {check.fields.Notes && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded-md">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Access Notes:</span> {check.fields.Notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Edit button if needed */}
                          {!isEditing && (
                            <button
                              // @ts-ignore
                              onClick={() => handleEditCheck(check)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No compliance history available</p>
              )}
            </div>

            {/* Ownership History - Show with message if no history */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900">Ownership History</h3>
              {mockData.data["Ownership Changes"]
                .filter(change => change.fields["Property ID"].includes(propertyDetails.property.id))
                .length > 0 ? (
                <div className="space-y-4">
                  {mockData.data["Ownership Changes"]
                    .filter(change => change.fields["Property ID"].includes(propertyDetails.property.id))
                    .map(change => (
                      <div key={change.id} className="bg-white p-4 rounded-md shadow-sm">
                        <div className="text-sm">
                          <p className="text-gray-500">{new Date(change.fields["Change Date"]).toLocaleDateString()}</p>
                          <p className="mt-1">
                            <span className="text-gray-600">From:</span> {change.fields["Previous Owner"]}
                          </p>
                          <p>
                            <span className="text-gray-600">To:</span> {change.fields["New Owner"]}
                          </p>
                          {change.fields.Notes && (
                            <p className="mt-2 text-gray-600">{change.fields.Notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No ownership changes recorded</p>
              )}
            </div>

            {/* Add New Check Button - Always show if property is selected */}
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => setShowNewCheckForm(!showNewCheckForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showNewCheckForm ? 'Cancel New Check' : 'Add New Compliance Check'}
              </button>
            </div>

            {/* New Check Form with color coding */}
            {showNewCheckForm && (
              <div className="mt-6 bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">New Compliance Check</h3>
                
                {/* Access Type Selection */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Access Type</h4>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="accessType"
                        value="key"
                        // @ts-ignore
                        checked={newCheckData.accessType === 'key'}
                        // @ts-ignore
                        onChange={(e) => setNewCheckData(prev => ({ ...prev, accessType: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-red-600">🔑 Key Required</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="accessType"
                        value="tenant"
                        // @ts-ignore
                        checked={newCheckData.accessType === 'tenant'}
                        // @ts-ignore
                        onChange={(e) => setNewCheckData(prev => ({ ...prev, accessType: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-black">👤 Tenant Access</span>
                    </label>
                  </div>
                </div>

                {/* Select Job Types */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-md font-medium text-gray-700">Select Job Types</h4>
                  {jobTypes.map(jobType => (
                    <div key={jobType} className="flex items-center">
                      <input
                        type="checkbox"
                        // @ts-ignore
                        checked={selectedJobTypes.includes(jobType)}
                        // @ts-ignore
                        onChange={() => handleJobTypeChange(jobType)}
                        className="h-4 w-4 border-gray-300 rounded"
                      />
                      <span 
                        className={`ml-2 px-2 py-1 rounded-md text-sm ${getJobTypeColor(jobType)}`}
                      >
                        {jobType}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Select Job Date */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-md font-medium text-gray-700">Select Job Date</h4>
                  <div className="flex space-x-4">
                    <select
                      value={selectedMonth}
                      // @ts-ignore
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="block w-full px-3 py-2 border rounded-md"
                    >
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      // @ts-ignore
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="block w-full px-3 py-2 border rounded-md"
                    >
                      {[currentYear, currentYear + 1, currentYear + 2].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-md font-medium text-gray-700">Additional Notes</h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="block w-full px-3 py-2 border rounded-md"
                    placeholder="Enter any additional notes or special instructions..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Compliance Check
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}