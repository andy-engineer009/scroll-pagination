'use client';

import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn, setIsInfluencerRegistered } from '@/store/userRoleSlice';
import { api } from '@/common/services/rest-api/rest-api';
import { API_ROUTES } from '@/appApi';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { influencerDropodownData, selectInfluencerDropdownData } from '@/store/apiDataSlice';
import Loader from '../loader';

// Types
interface FormValues {
  username: string;
  is_instagram_enabled: boolean;
  is_youtube_enabled: boolean;
  is_facebook_enabled: boolean;
  platforms_required?: any;
  gender: string;
  categories: any[];
  languages: any[];
  verified_profile: boolean;
  state: string;
  city: string;
  locality: string;
  age: number | null;
  follower_count: number | null;
  instagram_url: string;
  youtube_url: string;
  facebook_url: string;
  audience_type: string;
  audience_age_group: string;
  starting_price: number | null;
}

// Validation schema
const formSchema = Yup.object().shape({
  username: Yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  is_instagram_enabled: Yup.boolean().nullable(),
  is_youtube_enabled: Yup.boolean().nullable(),
  is_facebook_enabled: Yup.boolean().nullable(),
  platforms_required: Yup.mixed().test(
    'at-least-one-platform',
    'At least one platform must be selected',
    function (value, context) {
      const { is_instagram_enabled, is_youtube_enabled, is_facebook_enabled } = context.parent;
      return is_instagram_enabled || is_youtube_enabled || is_facebook_enabled;
    }
  ),
  gender: Yup.string().required('Gender is required'),
  categories: Yup.array().min(1, 'At least one category is required'),
  languages: Yup.array().min(1, 'At least one language is required'),
  state: Yup.string().required('State is required'),
  city: Yup.string().required('City is required'),
  // age: Yup.number().required('Age is required').min(13, 'Must be at least 13 years old').max(100, 'Invalid age'),
  follower_count: Yup.number().required('Follower count is required').min(100, 'Must have at least 100 followers'),
  instagram_url: Yup.string().when('is_instagram_enabled', {
    is: (is_instagram_enabled: boolean) => is_instagram_enabled === true,
    then: (schema) => schema.required('Instagram URL is required').url('Must be a valid URL')
  }),
  youtube_url: Yup.string().when('is_youtube_enabled', {
    is: (is_youtube_enabled: boolean) => is_youtube_enabled === true,
    then: (schema) => schema.required('YouTube URL is required').url('Must be a valid URL')
  }),
  facebook_url: Yup.string().when('is_facebook_enabled', {
    is: (is_facebook_enabled: boolean) => is_facebook_enabled === true,
    then: (schema) => schema.required('Facebook URL is required').url('Must be a valid URL')
  }),
  starting_price: Yup.number().required('Starting price is required').min(0, 'Starting price must be greater than 0'),
});

// Initial values
const initialValues: FormValues = {
  username: '',
  is_instagram_enabled: false,
  is_youtube_enabled: false,
  is_facebook_enabled: false,
  gender: '',
  categories: [],
  languages: [],
  verified_profile: false,
  state: '',
  city: '',
  locality: '',
  age: null,
  follower_count: null,
  instagram_url: '',
  youtube_url: '',
  facebook_url: '',
  audience_type: '',
  audience_age_group: '',
  platforms_required: '',
  starting_price: null
};

const audienceTypes = [
  { id: 0, name: 'all' },
  { id: 1, name: 'General' },
  { id: 2, name: 'Niche' },
  { id: 3, name: 'Specific' }
];

const audienceAgeGroups = [
  { id: 0, name: 'all' },
  { id: 1, name: '13-18' },
  { id: 2, name: '19-25' },
  { id: 3, name: '26-35' },
  { id: 4, name: '36-45' },
  { id: 5, name: '46-55' },
  { id: 6, name: '56+' }
];

// Multi-Select Checkbox Component
const MultiSelectCheckbox = ({ 
  label, 
  options, 
  field, 
  form 
}: {
  label: string;
  options: Array<{id: number, name: string}>;
  field: any;
  form: any;
}) => {
  const handleChange = (optionId: number) => {
    const currentValues = form.values[field.name] || [];
    const newValues = currentValues.includes(optionId)
      ? currentValues.filter((value: number) => value !== optionId)
      : [...currentValues, optionId];
    
    form.setFieldValue(field.name, newValues);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-black mb-3">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-1">
        {options.map((option) => (
          <label key={option.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              name={field.name}
              value={option.id}
              checked={(form.values[field.name] || []).includes(option.id)}
              onChange={() => handleChange(option.id)}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <span className="text-sm text-black">{option.name}</span>
          </label>
        ))}
      </div>
      <ErrorMessage name={field.name} component="div" className="text-red-500 text-sm mt-1" />
    </div>
  );
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

export default function InfluencerOnboardingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const dispatch = useDispatch();
  const influencerDropdownData = useSelector(selectInfluencerDropdownData);
  
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [localities, setLocalities] = useState([]);

  const router = useRouter();

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if(influencerDropdownData) {
      setCategories(influencerDropdownData.categories);
      setLanguages(influencerDropdownData.languages);
      setStates(influencerDropdownData.states);
      setCities(influencerDropdownData.cities);
      setLocalities(influencerDropdownData.locality);
    } else {
      setIsLoading(true);
      api.get(API_ROUTES.dropdownData).then((response) => {
        setIsLoading(false);
        if(response.status == 1) {
          const data: any = response.data;
          setCategories(data.categories);
          setLanguages(data.languages);
          setStates(data.states);
        setCities(data.cities);
        setLocalities(data.locality);
        dispatch(influencerDropodownData(data));
      }
    })
    }
  },[]);

  const handleSubmit = async (values: FormValues, { setSubmitting }: FormikHelpers<FormValues>) => {
    setIsLoading(true);
    try {
      const payload = {
        username: values.username,
        gender: parseInt(values.gender.toString()),
        age: values.age,
        follower_count: values.follower_count,
        verified_profile: values.verified_profile ? 1 : 0,
        is_instagram_enabled: values.is_instagram_enabled ? 1 : 0,
        is_youtube_enabled: values.is_youtube_enabled ? 1 : 0,
        is_facebook_enabled: values.is_facebook_enabled ? 1 : 0,
        instagram_url: values.instagram_url,
        youtube_url: values.youtube_url,
        facebook_url: values.facebook_url,
        audience_type: parseInt(values.audience_type.toString()),
        audience_age_group: parseInt(values.audience_age_group.toString()),
        state: parseInt(values.state.toString()),
        city: parseInt(values.city.toString()),
        locality: parseInt(values.locality.toString()),
        categories: values.categories.map((category: any) => parseInt(category.toString())),
        languages: values.languages.map((language: any) => parseInt(language.toString())),
        starting_price: values.starting_price
      }


      api.post(API_ROUTES.addUpdateInfluencer, payload).then((response) => {
        setIsLoading(false);
        if(response.status == 1) {
          showToast('Influencer profile created successfully!', 'success');
          dispatch(setIsInfluencerRegistered(true));
          router.push('/profile/edit');
    } else {
          showToast(response.message, 'error');
        }
      })
    } catch (error) {
      setIsLoading(false);
      console.error('Error submitting form:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {isLoading && <Loader/>}
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
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 pr-4 py-3">
        <div className="flex items-center justify-center relative">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 absolute left-0 top-1/2 -translate-y-1/2"
          >
            <svg className="w-5 h-5" fill="none" stroke="#ccc" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-medium text-gray-900"> Set Up Your Creator Profile</h1>
        </div>
      </header>

        {/* Main Content */}
        <div className="px-4 py-3">
          {/* Description */}
          <p className="text-gray-600 text-base mb-8 leading-relaxed text-[14px]">
            Join thousands of creators earning money through brand partnerships! Let's set up your profile in just a few minutes.
          </p>

          {/* Form */}
          <Formik
            initialValues={initialValues}
            validationSchema={formSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, isValid, dirty }: any) => (
              <Form className="space-y-8">
                {/* About You Section */}
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-black flex items-center mb-3">
                    🧑 About You
                  </h2>
                  
                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-black mb-2">
                      Username (Instagram/Facebook @username)
                    </label>
                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                      👉 Example: @yourhandle
                    </div>
                    <Field
                      type="text"
                      id="username"
                      name="username"
                      placeholder="@yourhandle"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                    />
                    <ErrorMessage name="username" component="div" className="mt-1 text-sm text-red-500" />
                  </div>
                </div>

                {/* Your Social Media Section */}
                <div className="mb-5">
                  <h2 className="mb-3 text-lg font-semibold text-black flex items-center">
                    📱 Your Social Media
                  </h2>
                  
                  {/* Platforms */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Platforms (choose at least 1 where you have 500+ followers)
                    </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-3">
                      <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          name="is_instagram_enabled"
                          checked={values.is_instagram_enabled === true}
                          onChange={() => setFieldValue('is_instagram_enabled', !values.is_instagram_enabled)}
                          className="h-5 w-5 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-black">Instagram</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          name="is_youtube_enabled"
                          checked={values.is_youtube_enabled === true}
                          onChange={() => setFieldValue('is_youtube_enabled', !values.is_youtube_enabled)}
                          className="h-5 w-5 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-black">YouTube</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <input
                          type="checkbox"
                          name="is_facebook_enabled"
                          checked={values.is_facebook_enabled === true}
                          onChange={() => setFieldValue('is_facebook_enabled', !values.is_facebook_enabled)}
                          className="h-5 w-5 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-black">Facebook</span>
                      </label>
                    </div>
                    <ErrorMessage name="platforms_required" component="div" className="mt-1 text-sm text-red-500" />
                  </div>
                  </div>

                {/* Platform URLs */}
                {values.is_instagram_enabled && (
                  <div>
                    <label htmlFor="instagram_url" className="block text-sm font-medium text-black mb-2">
                      Instagram Profile URL
                    </label>
                    <Field
                      type="url"
                      id="instagram_url"
                      name="instagram_url"
                      placeholder="https://instagram.com/yourusername"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                    />
                    <ErrorMessage name="instagram_url" component="div" className="mt-1 text-sm text-red-500" />
                  </div>
                )}

                {values.is_youtube_enabled && (
                  <div>
                    <label htmlFor="youtube_url" className="block text-sm font-medium text-black mb-2">
                      YouTube Channel URL
                    </label>
                    <Field
                      type="url"
                      id="youtube_url"
                      name="youtube_url"
                      placeholder="https://youtube.com/@yourchannel"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                    />
                    <ErrorMessage name="youtube_url" component="div" className="mt-1 text-sm text-red-500" />
                  </div>
                )}

                {values.is_facebook_enabled && (
                  <div>
                    <label htmlFor="facebook_url" className="block text-sm font-medium text-black mb-2">
                      Facebook Profile URL
                    </label>
                    <Field
                      type="url"
                      id="facebook_url"
                      name="facebook_url"
                      placeholder="https://facebook.com/yourusername"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                    />
                    <ErrorMessage name="facebook_url" component="div" className="mt-1 text-sm text-red-500" />
                  </div>
                )}

                  {/* Age */}
                  <div className='mt-3 mb-4'>
                    <label htmlFor="age" className="block text-sm font-medium text-black mb-2">
                      Age (optional)
                    </label>
                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                      👉 Enter your real age (brands like to know creator age)
                    </div>
                    <Field
                      type="number"
                      id="age"
                      name="age"
                      placeholder="e.g., 22"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                    />
                    <ErrorMessage name="age" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  {/* Total Followers */}
                  <div className='mb-4'>
                    <label htmlFor="follower_count" className="block text-sm font-medium text-black mb-2">
                      Total Followers (overall)
                    </label>
                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                      👉 Example: 1200
                    </div>
                    <Field
                      type="number"
                      id="follower_count"
                      name="follower_count"
                      placeholder="e.g., 1200"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                    />
                    <ErrorMessage name="follower_count" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  {/* Verified Profile */}
                  <div className='mb-0'>
                    <label className="block text-sm font-medium text-black mb-2">
                      Is your profile verified?
                    </label>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Field
                          type="radio"
                          id="verified_profile_yes"
                          name="verified_profile" 
                          value={true}
                          onChange={() => setFieldValue('verified_profile', true)}
                          className="h-4 w-4 text-black focus:ring-black border-gray-300"
                        />
                        <label htmlFor="verified_profile_yes" className="text-sm font-medium text-black">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Field
                          type="radio"
                          id="verified_profile_no"
                          name="verified_profile"
                          value={false}
                          onChange={() => setFieldValue('verified_profile', false)}
                          className="h-4 w-4 text-black focus:ring-black border-gray-300"
                        />
                        <label htmlFor="verified_profile_no" className="text-sm font-medium text-black">
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Gender */}
                  <div className='mb-4'>
                    <label htmlFor="gender" className="block text-sm font-medium text-black mb-2">
                      Gender
                    </label>
                    <Field
                      as="select"
                      id="gender"
                      name="gender"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black"
                    >
                      <option value="">Select Gender</option>
                      <option value="1">Male</option>
                      <option value="2">Female</option>
                      <option value="3">Other</option>
                    </Field>
                    <ErrorMessage name="gender" component="div" className="mt-1 text-sm text-red-500" />
                  </div>

                  {/* Categories */}
                  <Field name="categories">
                    {({ field, form }: any) => (
                      <div>
                        <MultiSelectCheckbox
                          label="Categories (select all that apply)"
                          options={categories}
                          field={field}
                          form={form}
                        />
                      </div>
                    )}
                  </Field>

                  {/* Languages */}
                  <Field name="languages">
                    {({ field, form }: any) => (
                      <div>
                        <MultiSelectCheckbox
                          label="Languages you use (select all that apply)"
                          options={languages}
                          field={field}
                          form={form}
                        />
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          👉 Example: Hindi, English, Punjabi
                        </div>
                      </div>
                    )}
                  </Field>
                {/* </div> */}


                {/* Location Section */}
                <div className="space-y-6">
                  <h2 className="mb-3 text-lg font-semibold text-black flex items-center">
                    📍 Location
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-black mb-2">
                        State
                      </label>
                      <Field
                        as="select"
                        id="state"
                        name="state"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black"
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          setFieldValue('state', e.target.value);
                          setFieldValue('city', '');
                          setFieldValue('locality', '');
                        }}
                      >
                        <option value="">Select State</option>
                        {states.map((state: any) => (
                          <option key={state.id} value={state.id}>{state.name}</option>
                        ))}
                      </Field>
                      <ErrorMessage name="state" component="div" className="mt-1 text-sm text-red-500" />
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-black mb-2">
                        City
                      </label>
                      <Field
                        as="select"
                        id="city"
                        name="city"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black"
                        disabled={!values.state}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          setFieldValue('city', e.target.value);
                          setFieldValue('locality', '');
                        }}
                      >
                        <option value="">Select City</option>
                        {values.state && cities.filter((city: any) => city.state_id === parseInt(values.state)).map((city: any) => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </Field>
                      <ErrorMessage name="city" component="div" className="mt-1 text-sm text-red-500" />
                    </div>

                    <div>
                      <label htmlFor="locality" className="block text-sm font-medium text-black mb-2">
                        Locality (optional)
                      </label>
                      <Field
                        as="select"
                        id="locality"
                        name="locality"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black"
                        disabled={!values.city}
                      >
                        <option value="">Select Locality</option>
                        {values.city && localities.filter((locality: any) => locality.city_id === parseInt(values.city)).map((locality: any) => (
                          <option key={locality.id} value={locality.id}>{locality.name}</option>
                        ))}
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Your Promotion Charges Section */}
                <div className="space-y-6">
                  <h2 className="mb-3 text-lg font-semibold text-black flex items-center">
                    💰 Your Promotion Charges
                  </h2>
                  
                  {/* Starting Price */}
                  <div>
                    <label htmlFor="starting_price" className="block text-sm font-medium text-black mb-2">
                      Starting Price (INR)
                    </label>
                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                      👉 Example: ₹200 for 1 post/story
                    </div>
                    <div className="text-xs text-gray-500 mb-2 flex items-center">
                      💡 Tip: If you are a nano influencer, start with a small price to get more work
                    </div>
                    <Field
                      type="number"
                      id="starting_price"
                      name="starting_price"
                      placeholder="e.g., 200"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black placeholder-gray-400"
                    />
                    <ErrorMessage name="starting_price" component="div" className="mt-1 text-sm text-red-500" />
                  </div>
                </div>
                
                {/* Your Audience Section */}
                <div className="space-y-6">
                  <h2 className="mb-3 text-lg font-semibold text-black flex items-center">
                    🎯 Your Audience
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="audience_type" className="block text-sm font-medium text-black mb-2">
                        Audience Type (optional)
                      </label>
                      <div className="text-xs text-gray-500 mb-2 flex items-center">
                        👉 Example: Students, Food Lovers, Fitness, Fashion
                      </div>
                      <Field
                        as="select"
                        id="audience_type"
                        name="audience_type"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black"
                      >
                        <option value="">Select Audience Type</option>
                        {audienceTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </Field>
                    </div>

                    <div>
                      <label htmlFor="audience_age_group" className="block text-sm font-medium text-black mb-2">
                        Audience Age Group (optional)
                      </label>
                      <div className="text-xs text-gray-500 mb-2 flex items-center">
                        👉 Example: 18–24, 25–34
                      </div>
                      <Field
                        as="select"
                        id="audience_age_group"
                        name="audience_age_group"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 text-black"
                      >
                        <option value="">Select Age Group</option>
                        {audienceAgeGroups.map(ageGroup => (
                          <option key={ageGroup.id} value={ageGroup.id}>{ageGroup.name}</option>
                        ))}
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Final Step */}
                <div className="space-y-6">
                  <div className="pt-6 flex justify-center">
                    <button
                      type="submit"
                      className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed mx-auto" style={{width: '90%'}}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <LoadingSpinner size="sm" />
                          <span>Creating your profile...</span>
                        </div>
                      ) : (
                        'Create My Profile'
                      )}
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}