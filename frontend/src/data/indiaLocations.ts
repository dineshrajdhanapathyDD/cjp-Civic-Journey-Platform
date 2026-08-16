/**
 * India Location Data — States, Union Territories, and Cities
 * Used throughout the CJP platform for location selection.
 */

export interface LocationData {
  state: string
  cities: string[]
}

export const STATES: LocationData[] = [
  { state: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Tirupati', 'Guntur', 'Nellore', 'Kakinada', 'Rajahmundry', 'Anantapur'] },
  { state: 'Arunachal Pradesh', cities: ['Itanagar', 'Naharlagun', 'Tawang'] },
  { state: 'Assam', cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur'] },
  { state: 'Bihar', cities: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'] },
  { state: 'Chhattisgarh', cities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'] },
  { state: 'Goa', cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'] },
  { state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar'] },
  { state: 'Haryana', cities: ['Gurugram', 'Faridabad', 'Karnal', 'Panipat', 'Ambala', 'Hisar', 'Rohtak'] },
  { state: 'Himachal Pradesh', cities: ['Shimla', 'Dharamshala', 'Manali', 'Kullu', 'Mandi'] },
  { state: 'Jharkhand', cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'] },
  { state: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Dharwad', 'Shimoga', 'Davangere'] },
  { state: 'Kerala', cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Kannur'] },
  { state: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar'] },
  { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Solapur', 'Kolhapur'] },
  { state: 'Manipur', cities: ['Imphal', 'Thoubal', 'Bishnupur'] },
  { state: 'Meghalaya', cities: ['Shillong', 'Tura', 'Jowai'] },
  { state: 'Mizoram', cities: ['Aizawl', 'Lunglei', 'Champhai'] },
  { state: 'Nagaland', cities: ['Kohima', 'Dimapur', 'Mokokchung'] },
  { state: 'Odisha', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'] },
  { state: 'Punjab', cities: ['Chandigarh', 'Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Bathinda'] },
  { state: 'Rajasthan', cities: ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar'] },
  { state: 'Sikkim', cities: ['Gangtok', 'Namchi', 'Pelling'] },
  { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Thanjavur', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Pudukkottai', 'Kanchipuram', 'Tiruppur'] },
  { state: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Secunderabad'] },
  { state: 'Tripura', cities: ['Agartala', 'Udaipur', 'Dharmanagar'] },
  { state: 'Uttar Pradesh', cities: ['Lucknow', 'Noida', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Ghaziabad', 'Greater Noida'] },
  { state: 'Uttarakhand', cities: ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Haldwani'] },
  { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman'] },
]

export const UNION_TERRITORIES: LocationData[] = [
  { state: 'Andaman and Nicobar Islands', cities: ['Port Blair'] },
  { state: 'Chandigarh', cities: ['Chandigarh'] },
  { state: 'Dadra and Nagar Haveli and Daman and Diu', cities: ['Daman', 'Silvassa'] },
  { state: 'Delhi', cities: ['New Delhi', 'Delhi'] },
  { state: 'Jammu and Kashmir', cities: ['Srinagar', 'Jammu', 'Anantnag'] },
  { state: 'Ladakh', cities: ['Leh', 'Kargil'] },
  { state: 'Lakshadweep', cities: ['Kavaratti'] },
  { state: 'Puducherry', cities: ['Puducherry', 'Karaikal'] },
]

export const ALL_STATES_UTS = [...STATES, ...UNION_TERRITORIES]

export const STATE_NAMES = ALL_STATES_UTS.map(s => s.state).sort()

export function getCitiesForState(stateName: string): string[] {
  const found = ALL_STATES_UTS.find(s => s.state === stateName)
  return found ? found.cities : []
}

export function getAllCities(): string[] {
  return ALL_STATES_UTS.flatMap(s => s.cities).sort()
}

export const CIVIC_CATEGORIES = [
  'Employment',
  'Education',
  'Skills & Training',
  'Infrastructure',
  'Public Services',
  'Transportation',
  'Environment',
  'Digital Access',
  'Healthcare Access',
  'Local Opportunities',
  'Other',
] as const

export type CivicCategory = typeof CIVIC_CATEGORIES[number]

export function formatLocation(city?: string, state?: string): string {
  if (city && state) return `${city}, ${state}, India`
  if (state) return `${state}, India`
  if (city) return `${city}, India`
  return 'India'
}
