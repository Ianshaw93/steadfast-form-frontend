'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { MagnifyingGlassIcon as SearchIcon, XCircleIcon, PlusCircleIcon } from '@heroicons/react/24/solid';
import mockData from '../data/mockData';

const jobTypes = [
  'Gas Safety Check',
  'Legionella Testing',
  'Smoke, Heat, and CO Alarms Testing',
  'Electrical Safety Check',
  'PAT Testing',
  'EPC (Energy Performance Certificate)',
  'Lead and Water Testing',
  'Boiler Maintenance and Pressure Checks'
];

const mockSearchProperties = (query) => {
  const properties = mockData.data.Properties.filter(property => 
    property.fields.Address.toLowerCase().includes(query.toLowerCase()) ||
    property.fields["Post Code"].toLowerCase().includes(query.toLowerCase())
  );
  return { properties };
};

const mockGetPropertyDetails = (propertyId) => {
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

const mockSearchOwners = (query) => {
  const owners = mockData.data.Contacts.filter(contact => 
    `${contact.fields["First Name"]} ${contact.fields["Last Name"]}`.toLowerCase().includes(query.toLowerCase()) ||
    contact.fields.Email.toLowerCase().includes(query.toLowerCase())
  );
  return { owners };
};

const mockSearchTenants = (query, existingTenants) => {
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

const getAccessTypeColor = (accessType) => {
  switch (accessType) {
    case 'key':
      return 'text-red-600';
    case 'tenant':
      return 'text-black';
    default:
      return 'text-gray-600';
  }
};

const getStatusColor = (status) => {
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

const getJobTypeColor = (jobType) => {
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
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState({
    address: '',
    postCode: '',
    owner: null,
    tenants: [],
    notes: '',
  });
  const [ownerSearch, setOwnerSearch] = useState('');
  const [debouncedOwner] = useDebounce(ownerSearch, 300);
  const [isNewOwner, setIsNewOwner] = useState(false);
  const [newOwnerData, setNewOwnerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
  });
  // const [selectedOwner, setSelectedOwner] = useState(null);
  const [tenantSearch, setTenantSearch] = useState('');
  const [debouncedTenant] = useDebounce(tenantSearch, 300);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [isNewTenant, setIsNewTenant] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    landline: '',
  });
  // const [editingTenantIndex, setEditingTenantIndex] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [filteredOwners, setFilteredOwners] = useState([]);
  const [isNewProperty, setIsNewProperty] = useState(false);
  const [newCheckData, setNewCheckData] = useState({
    accessType: 'unknown',
    jobTypes: [],
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    notes: ''
  });
  const [companySearch, setCompanySearch] = useState('');
  const [debouncedCompany] = useDebounce(companySearch, 300);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [editedOwnerData, setEditedOwnerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    company: '',
    role: 'Private Landlord'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showNewCheckForm, setShowNewCheckForm] = useState(false);
  const [selectedJobTypes, setSelectedJobTypes] = useState([
    'Gas Safety Check',
    'Legionella Testing',
    'Smoke, Heat, and CO Alarms Testing',
    'Electrical Safety Check',
    'PAT Testing'
  ]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState('');
  const [isEditingTenant, setIsEditingTenant] = useState(false);

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

  const years = Array.from(
    { length: 6 }, 
    (_, i) => new Date().getFullYear() + i
  );

  useEffect(() => {
    if (debouncedCompany) {
      setShowCompanyDropdown(true);
    } else {
      setShowCompanyDropdown(false);
    }
  }, [debouncedCompany]);

  const handleJobTypeChange = (jobType) => {
    setSelectedJobTypes(prev =>
      prev.includes(jobType)
        ? prev.filter(j => j !== jobType)
        : [...prev, jobType]
    );
  };

  const handleEditOwner = (owner) => {
    setEditedOwnerData({
      firstName: owner.fields["First Name"],
      lastName: owner.fields["Last Name"],
      email: owner.fields.Email,
      mobile: owner.fields["Mobile Number"],
      company: owner.fields.Company === "None" ? "" : owner.fields.Company,
      role: owner.fields.Role || 'Private Landlord'
    });
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
        setPropertyDetails(details);
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
      setFilteredTenants(results.tenants);
      setIsLoading(false);
    } else {
      setFilteredTenants([]);
    }
  }, [debouncedTenant, tenants]);

  const handleEditCheck = (check) => {
    setIsEditing(true);
    setNewCheckData({
      accessType: check.accessType || 'unknown',
      jobTypes: check.jobTypes || [],
      month: check.month || new Date().toLocaleString('default', { month: 'long' }),
      year: check.year || new Date().getFullYear(),
      notes: check.notes || ''
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Property Compliance Test Form
        </h2>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center mb-4">
            <span className="text-gray-500">Loading...</span>
          </div>
        )}

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
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                    <span className="text-sm text-gray-800 ml-2">
                      {property.fields["Post Code"]}
                    </span>
                  </li>
                ))}
                <li
                  onClick={() => {
                    setAddressSearch('');
                    setProperties([]);
                    setNewPropertyData({
                      ...newPropertyData,
                      address: addressSearch,
                      postCode: ''
                    });
                    setIsNewProperty(true);
                    setSelectedProperty(null);
                  }}
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 text-green-700"
                >
                  <div className="flex items-center">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    <span>Add new property: &quot;{addressSearch}&quot;</span>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Existing Property Flow */}
        {selectedProperty && propertyDetails && (
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
                {!propertyDetails?.owner && !isNewOwner && (
                  <button
                    onClick={() => setIsNewOwner(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 hover:text-blue-800"
                  >
                    <PlusCircleIcon className="h-5 w-5 mr-1" />
                    Add New Owner
                  </button>
                )}
              </div>

              {/* Owner Search - Show when adding new */}
              {isNewOwner && (
                <div className="mb-4 bg-white p-4 rounded-md shadow-sm">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={ownerSearch}
                      onChange={(e) => setOwnerSearch(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search for owner by name or email..."
                    />
                    {ownerSearch && (
                      <button
                        type="button"
                        onClick={() => setOwnerSearch('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      </button>
                    )}
                  </div>

                  {/* Search Results */}
                  {ownerSearch.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md">
                      <ul className="max-h-60 rounded-md py-1 text-base overflow-auto">
                        {filteredOwners.map((owner) => (
                          <li
                            key={owner.id}
                            onClick={() => {
                              setPropertyDetails({
                                ...propertyDetails,
                                owner: owner
                              });
                              setOwnerSearch('');
                              setIsNewOwner(false);
                            }}
                            className="cursor-pointer py-2 px-3 hover:bg-blue-50"
                          >
                            <div className="flex justify-between">
                              <span>
                                {owner.fields["First Name"]} {owner.fields["Last Name"]}
                              </span>
                              <span className="text-sm text-gray-800">
                                {owner.fields.Email}
                              </span>
                            </div>
                          </li>
                        ))}
                        <li
                          onClick={() => {
                            setNewOwnerData({
                              ...newOwnerData,
                              firstName: ownerSearch.split(' ')[0] || '',
                              lastName: ownerSearch.split(' ').slice(1).join(' ') || ''
                            });
                            setIsEditingOwner(true);
                            setIsNewOwner(false);
                            setOwnerSearch('');
                          }}
                          className="cursor-pointer py-2 px-3 hover:bg-green-50 text-green-700"
                        >
                          <div className="flex items-center">
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            <span>Add new owner: &quot;{ownerSearch}&quot;</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsNewOwner(false);
                      setOwnerSearch('');
                    }}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Current Owner Display */}
              {propertyDetails?.owner && !isEditingOwner && (
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      {propertyDetails.owner.fields.Company !== "None" && (
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {propertyDetails.owner.fields.Company}
                        </p>
                      )}
                      <p className="font-medium">
                        {propertyDetails.owner.fields["First Name"]} {propertyDetails.owner.fields["Last Name"]}
                      </p>
                      <p className="text-sm text-gray-800">{propertyDetails.owner.fields.Email}</p>
                      <p className="text-sm text-gray-800">{propertyDetails.owner.fields["Mobile Number"]}</p>
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
              {isEditingOwner && (
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
                                  setEditedOwnerData({ ...editedOwnerData, company: companySearch });
                                  setShowCompanyDropdown(false);
                                }}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 text-green-700"
                              >
                                <div className="flex items-center">
                                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                                  <span>Add new company: &quot;{companySearch}&quot;</span>
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
                        value={editedOwnerData.role}
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
                          // First create the new owner object
                          const newOwner = {
                            id: `new-${Date.now()}`,
                            fields: {
                              "First Name": editedOwnerData.firstName,
                              "Last Name": editedOwnerData.lastName,
                              "Email": editedOwnerData.email,
                              "Mobile Number": editedOwnerData.mobile,
                              "Company": editedOwnerData.company || "None",
                              "Role": editedOwnerData.role
                            }
                          };

                          // Log to verify the data
                          console.log('Adding new owner:', newOwner);

                          // Update propertyDetails using the callback form of setState
                          setPropertyDetails(prevDetails => {
                            console.log('Previous details:', prevDetails);
                            const updatedDetails = {
                              ...prevDetails,
                              owner: newOwner
                            };
                            console.log('Updated details:', updatedDetails);
                            return updatedDetails;
                          });

                          // Reset the form
                          setIsEditingOwner(false);
                          setIsNewOwner(false);
                          setEditedOwnerData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            mobile: '',
                            company: '',
                            role: 'Private Landlord'
                          });
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                      >
                        Save Owner
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
                {!isEditingTenant && (
                  <button
                    onClick={() => setIsNewTenant(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 hover:text-blue-800"
                  >
                    <PlusCircleIcon className="h-5 w-5 mr-1" />
                    Add New Tenant
                  </button>
                )}
              </div>

              {/* New Tenant Form */}
              {isEditingTenant && (
                <div className="mb-4 bg-white p-4 rounded-md shadow-sm">
                  <h4 className="text-md font-medium text-gray-700 mb-4">New Tenant Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={newTenantData.firstName}
                        onChange={(e) => setNewTenantData({ ...newTenantData, firstName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={newTenantData.lastName}
                        onChange={(e) => setNewTenantData({ ...newTenantData, lastName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={newTenantData.email}
                        onChange={(e) => setNewTenantData({ ...newTenantData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                      <input
                        type="tel"
                        value={newTenantData.mobile}
                        onChange={(e) => setNewTenantData({ ...newTenantData, mobile: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Landline (Optional)</label>
                      <input
                        type="tel"
                        value={newTenantData.landline}
                        onChange={(e) => setNewTenantData({ ...newTenantData, landline: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          console.log('Canceling tenant edit');
                          setIsEditingTenant(false);
                          setIsNewTenant(false);
                          setNewTenantData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            mobile: '',
                            landline: ''
                          });
                        }}
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          console.log('Saving new tenant');
                          const newTenant = {
                            id: `new-${Date.now()}`,
                            fields: {
                              "First Name": newTenantData.firstName,
                              "Last Name": newTenantData.lastName,
                              "Email": newTenantData.email,
                              "Mobile Number": newTenantData.mobile,
                              "Landline": newTenantData.landline || ''
                            }
                          };
                          console.log('New tenant object:', newTenant);
                          setTenants(prev => [...prev, newTenant]);
                          setIsEditingTenant(false);
                          setIsNewTenant(false);
                          setNewTenantData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            mobile: '',
                            landline: ''
                          });
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                      >
                        Save Tenant
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search interface - Only show when adding new and not editing */}
              {isNewTenant && !isEditingTenant && (
                <div className="mb-4 bg-white p-4 rounded-md shadow-sm">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={tenantSearch}
                      onChange={(e) => setTenantSearch(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600 focus:outline-none focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search for tenant by name, email, or phone..."
                    />
                    {tenantSearch && (
                      <button
                        type="button"
                        onClick={() => setTenantSearch('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                      </button>
                    )}
                  </div>

                  {/* Search Results */}
                  {tenantSearch.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-md">
                      <ul className="max-h-60 rounded-md py-1 text-base overflow-auto">
                        {filteredTenants.map((tenant) => (
                          <li
                            key={tenant.id}
                            onClick={() => {
                              console.log('Existing tenant selected:', tenant);
                              setTenants([...tenants, tenant]);
                              setTenantSearch('');
                              setIsNewTenant(false);
                            }}
                            className="cursor-pointer py-2 px-3 hover:bg-blue-50"
                          >
                            <div className="flex justify-between">
                              <div>
                                <p>{tenant.fields["First Name"]} {tenant.fields["Last Name"]}</p>
                                <p className="text-sm text-gray-800">{tenant.fields.Email}</p>
                                <p className="text-sm text-gray-800">{tenant.fields["Mobile Number"]}</p>
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
                          </li>
                        ))}
                        <li
                          onClick={() => {
                            console.log('Add new tenant clicked');
                            console.log('Current search:', tenantSearch);
                            console.log('Current isEditingTenant:', isEditingTenant);
                            console.log('Current isNewTenant:', isNewTenant);
                            
                            // Update the new tenant data
                            setNewTenantData(prev => {
                              const updated = {
                                ...prev,
                                firstName: tenantSearch.split(' ')[0] || '',
                                lastName: tenantSearch.split(' ').slice(1).join(' ') || ''
                              };
                              console.log('New tenant data:', updated);
                              return updated;
                            });

                            // Switch modes
                            setIsNewTenant(false);
                            setIsEditingTenant(true);
                            setTenantSearch('');

                            console.log('States updated. isEditingTenant should now be true');
                          }}
                          className="cursor-pointer py-2 px-3 hover:bg-green-50 text-green-700"
                        >
                          <div className="flex items-center">
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            <span>Add new tenant: &quot;{tenantSearch}&quot;</span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsNewTenant(false);
                      setTenantSearch('');
                    }}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Existing Tenants List */}
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="bg-white p-4 rounded-md shadow-sm">
                    <div className="flex justify-between">
                      <div>
                        <p>{tenant.fields["First Name"]} {tenant.fields["Last Name"]}</p>
                        <p className="text-sm text-gray-800">{tenant.fields.Email}</p>
                        <p className="text-sm text-gray-800">{tenant.fields["Mobile Number"]}</p>
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
                              <span className={`text-sm font-medium ${getAccessTypeColor(check.fields.AccessType || 'tenant')}`}>
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
                onClick={() => setShowNewCheckForm(prev => !prev)}
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
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="accessType"
                      value="unknown"
                      checked={newCheckData.accessType === 'unknown'}
                      onChange={(e) => setNewCheckData(prev => ({ ...prev, accessType: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-gray-600">❓ Unknown</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="accessType"
                      value="key"
                      checked={newCheckData.accessType === 'key'}
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
                      checked={newCheckData.accessType === 'tenant'}
                      onChange={(e) => setNewCheckData(prev => ({ ...prev, accessType: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-black">👤 Tenant Access</span>
                  </label>
                </div>

                {/* Select Job Types */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-md font-medium text-gray-700">Select Job Types</h4>
                  {jobTypes.map(jobType => (
                    <div key={jobType} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedJobTypes.includes(jobType)}
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
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="block w-full px-3 py-2 border rounded-md"
                    >
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="block w-full px-3 py-2 border rounded-md"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
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

        {/* New Property Flow */}
        {isNewProperty && (
          <div className="space-y-6">
            {/* Property Details Form */}
            <div className="mt-4 space-y-4 bg-white p-4 rounded-md shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={newPropertyData.address}
                  onChange={(e) => setNewPropertyData({
                    ...newPropertyData,
                    address: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Post Code</label>
                <input
                  type="text"
                  value={newPropertyData.postCode}
                  onChange={(e) => setNewPropertyData({
                    ...newPropertyData,
                    postCode: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsNewProperty(false);
                    setNewPropertyData({
                      address: '',
                      postCode: '',
                      owner: null,
                      tenants: [],
                      notes: ''
                    });
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newPropertyData.address && newPropertyData.postCode) {
                      // Create a mock property object to match the structure of existing properties
                      const mockProperty = {
                        id: `new-${Date.now()}`,
                        fields: {
                          Address: newPropertyData.address,
                          "Post Code": newPropertyData.postCode,
                          "Property ID": `NEW-${Date.now()}`
                        }
                      };
                      setSelectedProperty(mockProperty);
                      setPropertyDetails({
                        property: mockProperty,
                        owner: null,
                        tenants: []
                      });
                      setIsNewProperty(false);
                    }
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  Create Property
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Tenant Form */}
        {isEditingTenant && console.log('Rendering edit tenant form', {isEditingTenant, newTenantData})}
        {isEditingTenant && (
          <div className="mb-4 bg-white p-4 rounded-md shadow-sm">
            <h4 className="text-md font-medium text-gray-700 mb-4">New Tenant Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={newTenantData.firstName}
                  onChange={(e) => setNewTenantData({ ...newTenantData, firstName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={newTenantData.lastName}
                  onChange={(e) => setNewTenantData({ ...newTenantData, lastName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newTenantData.email}
                  onChange={(e) => setNewTenantData({ ...newTenantData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <input
                  type="tel"
                  value={newTenantData.mobile}
                  onChange={(e) => setNewTenantData({ ...newTenantData, mobile: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Landline (Optional)</label>
                <input
                  type="tel"
                  value={newTenantData.landline}
                  onChange={(e) => setNewTenantData({ ...newTenantData, landline: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsEditingTenant(false);
                    setNewTenantData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      mobile: '',
                      landline: ''
                    });
                  }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Create a new tenant object
                    const newTenant = {
                      id: `new-${Date.now()}`,
                      fields: {
                        "First Name": newTenantData.firstName,
                        "Last Name": newTenantData.lastName,
                        "Email": newTenantData.email,
                        "Mobile Number": newTenantData.mobile,
                        "Landline": newTenantData.landline || ''
                      }
                    };
                    
                    // Add to tenants list
                    setTenants([...tenants, newTenant]);
                    
                    // Reset form
                    setIsEditingTenant(false);
                    setNewTenantData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      mobile: '',
                      landline: ''
                    });
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
                >
                  Save Tenant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}