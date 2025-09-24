'use client';

import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import { api } from '@/common/services/rest-api/rest-api';
import { API_ROUTES } from '@/appApi';
import { useSelector, useDispatch } from 'react-redux';
import { influencerDropodownData, selectInfluencerDropdownData } from '@/store/apiDataSlice';
import Loader from '../loader';
import LoginPopup from '../login-popup';

// Types
// interface FormValues {
//   title: string;
//   description: string;
//   // categories: any;
//   languages: any[];
//   minimum_followers: number;
//   platforms: any[];
//   total_budget: number;
//   gender_preference: string;
//   age_group: string;
//   brand_image?: File | null;
// }

// Validation schema
const formSchema = Yup.object().shape({
  compaign_name: Yup.string().required('Campaign name is required').min(3, 'Campaign name must be at least 3 characters'),
  compaign_description: Yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  // categories: Yup.object().required('At least one category is required'),
  campaign_languages: Yup.array().min(1, 'At least one language is required'),
  minimum_followers: Yup.number().required('Minimum followers is required').min(500, 'Must be at least 500 followers'),
  platforms: Yup.array().min(1, 'At least one platform is required').of(Yup.string().oneOf(['instagram', 'youtube', 'facebook'])),
  total_budget: Yup.number().required('Total budget is required').min(1, 'Budget must be greater than 0').max(500000, 'Budget must be less than 500000').integer('Budget must be a whole number'),
  gender_preference: Yup.string().required('Gender preference is required'),
  age_group: Yup.string().required('Age group is required'),
  brand_image: Yup.mixed().nullable(),
});

const platforms = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' }
];

const genderPreferences = [
  { value: 0, label: 'All' },
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
  { value: 3, label: 'Other' }
];

const ageGroups = [
  { value: 0, label: 'all' },
  { value: 1, label: '13-18' },
  { value: 2, label: '19-25' },
  { value: 3, label: '26-35' },
  { value: 4, label: '36-45' },
  { value: 5, label: '46-55' },
  { value: 6, label: '56+' }
];

// Test categories for demonstration purp oses
const categoriesList = [
  { value: 1, label: 'All' },
  { value: 2, label: 'Art' },
  { value: 3, label: 'Acting' },
  { value: 4, label: 'Adventure' },
  { value: 5, label: 'Animals & Pets' },
  { value: 6, label: 'Automotive' },
  { value: 7, label: 'Beauty' },
  { value: 8, label: 'Blogging' },
  { value: 9, label: 'Books' },
  { value: 10, label: 'Business & Entrepreneurship' },
  { value: 11, label: 'Comedy' },
  { value: 12, label: 'Cooking' },
  { value: 13, label: 'Crafts' },
  { value: 14, label: 'Culture' },
  { value: 15, label: 'Career & Jobs' },
  { value: 16, label: 'Dance' },
  { value: 17, label: 'DIY (Do It Yourself)' },
  { value: 18, label: 'Design' },
  { value: 19, label: 'Digital Marketing' },
  { value: 20, label: 'Education' },
  { value: 21, label: 'Entertainment' },
  { value: 22, label: 'Environment' },
  { value: 23, label: 'Events' },
  { value: 24, label: 'Fashion' },
  { value: 25, label: 'Finance' },
  { value: 26, label: 'Fitness' },
  { value: 27, label: 'Food' },
  { value: 28, label: 'Family & Parenting' },
  { value: 29, label: 'Gaming' },
  { value: 30, label: 'Gardening' },
  { value: 31, label: 'Graphic Design' },
  { value: 32, label: 'Gadgets & Tech Reviews' },
  { value: 33, label: 'Health' },
  { value: 34, label: 'Home Decor' },
  { value: 35, label: 'Hiking' },
  { value: 36, label: 'History' },
  { value: 37, label: 'Inspiration & Motivation' },
  { value: 38, label: 'Interior Design' },
  { value: 39, label: 'Investments' },
  { value: 40, label: 'Illustration' },
  { value: 41, label: 'Jewellery' },
  { value: 42, label: 'Journalism' },
  { value: 43, label: 'Jobs & Career Tips' },
  { value: 44, label: 'Kids & Parenting' },
  { value: 45, label: 'Kitchen Hacks' },
  { value: 46, label: 'Knowledge Sharing' },
  { value: 47, label: 'Lifestyle' },
  { value: 48, label: 'Luxury' },
  { value: 49, label: 'Literature' },
  { value: 50, label: 'Language Learning' },
  { value: 51, label: 'Makeup' },
  { value: 52, label: 'Motivation' },
  { value: 53, label: 'Mental Health' },
  { value: 54, label: 'Movies & TV' },
  { value: 55, label: 'Nature' },
  { value: 56, label: 'Nutrition' },
  { value: 57, label: 'News & Politics' },
  { value: 58, label: 'Non-profits & Causes' },
  { value: 59, label: 'Outdoors' },
  { value: 60, label: 'Online Business' },
  { value: 61, label: 'Organic Living' },
  { value: 62, label: 'Photography' },
  { value: 63, label: 'Personal Development' },
  { value: 64, label: 'Pets' },
  { value: 65, label: 'Podcasts' },
  { value: 66, label: 'Productivity' },
  { value: 67, label: 'Quotes & Motivation' },
  { value: 68, label: 'Quick Recipes' },
  { value: 69, label: 'Recipes' },
  { value: 70, label: 'Reviews' },
  { value: 71, label: 'Relationships' },
  { value: 72, label: 'Road Trips' },
  { value: 73, label: 'Real Estate' },
  { value: 74, label: 'Sports' },
  { value: 75, label: 'Spirituality' },
  { value: 76, label: 'Science' },
  { value: 77, label: 'Singing' },
  { value: 78, label: 'Skincare' },
  { value: 79, label: 'Startups' },
  { value: 80, label: 'Travel' },
  { value: 81, label: 'Technology' },
  { value: 82, label: 'Theatre' },
  { value: 83, label: 'Tutorials' },
  { value: 84, label: 'Training & Coaching' },
  { value: 85, label: 'Urban Exploration' },
  { value: 86, label: 'Upcycling' },
  { value: 87, label: 'UI/UX Design' },
  { value: 88, label: 'Vlogging' },
  { value: 89, label: 'Vegan Lifestyle' },
  { value: 90, label: 'Visual Arts' },
  { value: 91, label: 'Volunteering' },
  { value: 92, label: 'Wellness' },
  { value: 93, label: 'Wildlife' },
  { value: 94, label: 'Writing' },
  { value: 95, label: 'Wedding Planning' },
  { value: 96, label: 'Workout' },
  { value: 97, label: 'Extreme Sports' },
  { value: 98, label: 'Experiential Travel' },
  { value: 99, label: 'Exhibitions' },
  { value: 100, label: 'Yoga' },
  { value: 101, label: 'Youth Lifestyle' },
  { value: 102, label: 'YouTube Tutorials' },
  { value: 103, label: 'Zero Waste Lifestyle' },
  { value: 104, label: 'Zoology Awareness' }
];

// Languages list
const languagesList = [
  { value: 1, label: 'All' },
  { value: 2, label: 'Hindi' },
  { value: 3, label: 'English' },
  { value: 4, label: 'Punjabi' },
  { value: 5, label: 'Marathi' },
  { value: 6, label: 'Haryanvi' },
  { value: 7, label: 'Bhojpuri' },
  { value: 8, label: 'Rajasthani' },
  { value: 9, label: 'Tamil' },
  { value: 10, label: 'Telugu' },
  { value: 11, label: 'Urdu' },
  { value: 12, label: 'Kannada' },
  { value: 13, label: 'Malayalam' },
  { value: 14, label: 'Nepali' },
  { value: 15, label: 'Sanskrit' },
  { value: 16, label: 'Bengali' },
  { value: 17, label: 'Assamese' }
];


// Custom Select Styles
const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    padding: '8px 12px',
    border: state.isFocused ? '2px solid #000' : '1px solid #d1d5db',
    borderRadius: '8px',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(0, 0, 0, 0.1)' : 'none',
    '&:hover': {
      border: state.isFocused ? '2px solid #000' : '1px solid #9ca3af'
    }
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#000' : state.isFocused ? '#f3f4f6' : 'white',
    color: state.isSelected ? 'white' : '#000',
    padding: '12px 16px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: state.isSelected ? '#000' : '#f3f4f6'
    }
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: '#000',
    color: 'white',
    borderRadius: '6px',
    padding: '2px 6px'
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: 'white',
    fontWeight: '500'
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: 'white',
    '&:hover': {
      backgroundColor: '#374151',
      color: 'white'
    }
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: '#9ca3af'
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  })
};

// Loading spinner component
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <svg className={`animate-spin ${sizeClasses[size]} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

export default function CampaignsCreate() {    
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const dispatch = useDispatch();
  const influencerDropdownData = useSelector(selectInfluencerDropdownData);

  const [categories, setCategories] = useState(categoriesList);
  const [languages, setLanguages] = useState(languagesList);
  const [brandImagePreview, setBrandImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by only rendering Select components on client
  // useEffect(() => {
  //   setIsClient(true);
  // }, []);

  // Initial values
  let initialValues: any = {
    compaign_name: '',
    compaign_description: '',
    // categories: '',
    campaign_languages: [],
    minimum_followers: 0,
    platforms: [],
    total_budget: 0,
    gender_preference: '',
    age_group: '',
    brand_image: null
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Handle brand image upload
  const handleBrandImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setBrandImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle brand image deletion
  const handleBrandImageDelete = () => {
    setBrandImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input click
  const handleBrandImageClick = () => {
    fileInputRef.current?.click();
  };

  // Fetch dropdown data
  useEffect(() => {
    // const fetchData = async () => {
    //   try {
    //     if(influencerDropdownData) {
    //       setCategories(influencerDropdownData.categories);
    //       setLanguages(influencerDropdownData.languages);
    //     } else {
    //       // Fetch dropdown data
    //       const dropdownResponse = await api.get(API_ROUTES.dropdownData);
    //       if (dropdownResponse.status === 1) {
    //         const data: any = dropdownResponse.data;
    //         // setCategories(data.categories);
    //         setLanguages(data.languages);
    //         dispatch(influencerDropodownData(data));
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error fetching data:', error);
    //     showToast('Error loading dropdown data', 'error');
    //   }
    // };

    // fetchData();
  }, []);

  const handleSubmit = async (values: any, { setSubmitting }: FormikHelpers<any>) => {
      const payload = {
        compaign_name: values.compaign_name,
        compaign_description: values.compaign_description,
        // categories: [values.categories],
        campaign_languages: values.campaign_languages.map((language: any) => parseInt(language.value.toString())),
        minimum_followers: values.minimum_followers,
        is_youtube_enabled: values.platforms.includes('youtube') == true ? 1 : 0,
        is_facebook_enabled: values.platforms.includes('facebook') == true ? 1 : 0,
        is_instagram_enabled: values.platforms.includes('instagram') == true ? 1 : 0,
        total_budget: values.total_budget,
        gender_preference: parseInt(values.gender_preference),
        age_group: parseInt(values.age_group),
        campaign_logo_url: values.brand_image
      };

      console.log(payload);
      // return
      setIsLoading(true);

      // Replace with your actual API endpoint for campaign creation
   api.post(API_ROUTES.createCampaign, payload).then((response: any) => {
    setIsLoading(false);
    if (response.status === 1) {
      showToast('Campaign created successfully!', 'success');
      // Reset form to initial values
      router.push(`/manage-campaigns`);

      // initialValues = {
      //   compaign_name: '',
      //   compaign_description: '',
      //   campaign_languages: [],
      //   minimum_followers: 0,
      //   platforms: [],
      //   total_budget: 0,
      //   gender_preference: '',
      //   age_group: '',
      //   brand_image: null
      // };
    } else {
      showToast(response.message || 'Failed to create campaign', 'error');
    }
   })
  }
   

  return (
    <>
      <LoginPopup />  
      {isLoading && <Loader />}
      <div className="min-h-screen bg-white text-gray-900">
        {/* Toast Notifications */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center max-w-sm backdrop-blur-sm`}>
            <span className="mr-2 font-bold text-lg">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-white hover:text-gray-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="w-full px-2 py-3 border-b border-gray-200 sticky top-0 z-[100] bg-white">
          <div className="relative">
            <div
                onClick={() => router.back()} 
              className="mr-2 p-2 hover:bg-gray-100 rounded-full transition-colors absolute left-0 top-1/2 -translate-y-1/2"
            >
              <svg className="w-6 h-6 text-gray-600 hover:text-gray-900" fill="none" stroke="#ccc" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <h1 className="text-lg font-medium text-gray-900 text-center">Create Campaign</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-3">
          {/* Description */}
          <p className="text-gray-600 text-base mb-8 leading-relaxed text-[14px]">
            Create a new campaign to connect with influencers and reach your target audience.
          </p>

          {/* Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={formSchema}
            onSubmit={handleSubmit}
            enableReinitialize={false}
          >
            {({ values, setFieldValue, isValid, dirty }) => (
              <Form className="space-y-6">
                
                                {/* Brand Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Brand Image (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      id="brand_image"
                      name="brand_image"
                      accept="image/*"
                      onChange={(event) => {
                        handleBrandImageUpload(event);
                        // Also update Formik value
                        const file = event.target.files?.[0];
                        setFieldValue('brand_image', file || null);
                      }}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    
                    {/* 200x200 Upload Box */}
                    <div 
                      className="w-full h-[150px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors duration-200 bg-gray-50 hover:bg-gray-100"
                      onClick={handleBrandImageClick}
                    >
                      {brandImagePreview ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={brandImagePreview} 
                            alt="Brand Preview" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {/* Cross button overlay */}  
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBrandImageDelete();
                              setFieldValue('brand_image', null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200 shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          {/* <p className="text-sm text-gray-500">Click to upload</p>
                          <p className="text-xs text-gray-400 mt-1">200x200 recommended</p> */}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>

                {/* Campaign Name */}
                <div>
                  <label htmlFor="compaign_name" className="block text-sm font-medium text-black mb-2">
                    Campaign Name
                  </label>
                  <Field
                    type="text"
                    id="compaign_name"
                    name="compaign_name"
                    placeholder="Enter campaign name"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                  />
                  <ErrorMessage name="compaign_name" component="div" className="mt-1 text-sm text-red-500" />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="compaign_description" className="block text-sm font-medium text-black mb-2">
                    Description (write your requirment)
                  </label>
                  <Field
                    as="textarea"
                    id="compaign_description"
                    name="compaign_description"
                    rows={4}
                    placeholder="Enter campaign description and instructions"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400 resize-none outline-none"
                  />
                  <ErrorMessage name="compaign_description" component="div" className="mt-1 text-sm text-red-500" />
                </div>

                {/* Categories */}
                {/* <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Categories (Select all that apply)
                  </label>
                  {isClient ? (
                    <Select
                      key="categories-select"
                      // isMulti
                      options={categories}
                      value={values.categories}
                      onChange={(selectedOptions) => setFieldValue('categories', selectedOptions || [])}
                      placeholder="Select categories"
                      styles={customSelectStyles}
                      className="text-sm"
                    />
                  ) : (
                    <div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  )}

                  <ErrorMessage name="categories" component="div" className="mt-1 text-sm text-red-500" />
                </div> */}

                {/* Languages */}
                <div>
                  <label htmlFor="campaign_languages" className="block text-sm font-medium text-black mb-2">
                    Languages (Select all that apply)
                  </label>
              
                    <Select
                      key="languages-select"
                      isMulti
                      options={languages}
                      value={values.campaign_languages}
                      onChange={(selectedOptions) => setFieldValue('campaign_languages', selectedOptions || [])}
                      placeholder="Select languages"
                      styles={customSelectStyles}
                      className="text-sm"
                    />
            
                  <ErrorMessage name="campaign_languages" component="div" className="mt-1 text-sm text-red-500" />
                </div>

                {/* Minimum Followers and Platforms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="minimum_followers" className="block text-sm font-medium text-black mb-2">
                      Minimum Followers
                    </label>
                    <Field
                      type="number"
                      id="minimum_followers"
                      name="minimum_followers"
                      placeholder="Enter minimum followers"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                    />
                    <ErrorMessage name="minimum_followers" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Platforms (Select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {platforms.map(platform => (
                        <label key={platform.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                          <Field
                            type="checkbox"
                            name="platforms"
                            value={platform.value}
                            className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black focus:ring-2 checked:bg-black checked:border-black"
                          />
                          <span className="text-sm text-gray-700 font-medium select-none">{platform.label}</span>
                        </label>
                      ))}
                    </div>
                    <ErrorMessage name="platforms" component="div" className="mt-1 text-sm text-red-500" />
                  </div>
                </div>

                {/* Total Budget */}
                <div>
                  <label htmlFor="total_budget" className="block text-sm font-medium text-black mb-2">
                    Total Budget (INR)
                  </label>
                  <Field
                    type="number"
                    id="total_budget"
                    name="total_budget"
                    placeholder="Enter total budget"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg  focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                  />
                  <ErrorMessage name="total_budget" component="div" className="mt-1 text-sm text-red-500" />
                </div>

                {/* Gender Preference and Age Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="gender_preference" className="block text-sm font-medium text-black mb-2">
                      Gender Preference
                    </label>
                    <Field
                      as="select"
                      id="gender_preference"
                      name="gender_preference"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg  focus:ring-black focus:border-black transition-all duration-200 text-black outline-none"
                    >
                      <option value="">Select Gender</option>
                      {genderPreferences.map(gender => (
                        <option key={gender.value} value={gender.value}>{gender.label}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="gender_preference" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  <div>
                    <label htmlFor="age_group" className="block text-sm font-medium text-black mb-2">
                      Age Group
                    </label>
                    <Field
                      as="select"
                      id="age_group"
                      name="age_group"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg  focus:ring-black focus:border-black transition-all duration-200 text-black outline-none"
                    >
                      <option value="">Select Age Group</option>
                      {ageGroups.map(ageGroup => (
                        <option key={ageGroup.value} value={ageGroup.value}>{ageGroup.label}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="age_group" component="div" className="mt-1 text-sm text-red-500" />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 flex justify-center">
                  <button
                    type="submit"
                    // disabled={!isValid || !dirty || isLoading}
                    className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed mx-auto"
                    style={{width: '90%'}}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span>Creating campaign...</span>
                      </div>
                    ) : (
                      'Create Campaign'
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
