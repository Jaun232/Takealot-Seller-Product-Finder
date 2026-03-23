import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Product, ProductOfferSummary } from './types';
import {
  fetchSellerProducts,
  fetchListingProducts,
  fetchProductOffers,
  fetchProductSearchResults,
} from './services/takealotService';
import SearchForm, { SearchMode } from './components/SearchForm';
import ProductGrid from './components/ProductGrid';
import Spinner from './components/Spinner';
import SearchGuide from './components/SearchGuide';
import ProductOfferHighlights from './components/ProductOfferHighlights';
import { CloseIcon } from './components/icons/CloseIcon';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';

const TAKEALOT_HOST_SNIPPET = 'takealot.com';
type Theme = 'dark' | 'light';
type FeaturedGroup =
  | 'Appliances'
  | 'DIY & Auto'
  | 'Baby'
  | 'Beauty'
  | 'Books'
  | 'Outdoor'
  | 'Fashion'
  | 'Travel'
  | 'Electronics'
  | 'Gaming & Media'
  | 'Garden & Pool'
  | 'Groceries'
  | 'Health'
  | 'Homeware'
  | 'Liquor'
  | 'Office'
  | 'Pets'
  | 'Sport'
  | 'Toys'
  | 'General';
const FEATURED_LISTS = [
  {
    label: 'New To Takealot Appliances',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-appliances&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Small Appliances',
    listingUrl: 'https://www.takealot.com/home-kitchen/small--appliances',
  },
  {
    label: 'Airfryers',
    listingUrl: 'https://www.takealot.com/airfryers',
  },
  {
    label: 'Top Rated Kettles',
    listingUrl: 'https://www.takealot.com/home-kitchen/kettles-25790?sort=Rating%20Descending',
  },
  {
    label: 'Top Rated Blenders',
    listingUrl: 'https://www.takealot.com/home-kitchen/blenders-25764?sort=Rating%20Descending',
  },
  {
    label: 'Coffee Machines',
    listingUrl: 'https://www.takealot.com/coffee-machines',
  },
  {
    label: 'Top Rated Fans',
    listingUrl: 'https://www.takealot.com/home-kitchen/fans-25799?sort=Rating%20Descending',
  },
  {
    label: 'Vacuums',
    listingUrl: 'https://www.takealot.com/vacuums',
  },
  {
    label: 'Large Appliances',
    listingUrl: 'https://www.takealot.com/home-kitchen/large-appliances',
  },
  {
    label: 'Top Rated Fridges and Freezers',
    listingUrl: 'https://www.takealot.com/home-kitchen/fridges-and-freezers-25722?sort=Rating%20Descending',
  },
  {
    label: 'Microwaves',
    listingUrl: 'https://www.takealot.com/microwaves',
  },
  {
    label: 'Top Rated Washing and Drying',
    listingUrl: 'https://www.takealot.com/home-kitchen/washing-and-drying-25723?sort=Rating%20Descending',
  },
  {
    label: 'Top Rated Dishwashers',
    listingUrl: 'https://www.takealot.com/home-kitchen/dishwashers-25721?sort=Rating%20Descending',
  },
  {
    label: 'Top Rated Stoves and Ovens',
    listingUrl: 'https://www.takealot.com/home-kitchen/stoves-and-ovens-25731?sort=Rating%20Descending',
  },
  {
    label: 'New To Takealot DIY and Auto',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-diy-and-auto&sort=ReleaseDate%20Descending',
  },
  {
    label: 'DIY and Auto',
    listingUrl: 'https://www.takealot.com/pool-garden/diy_auto',
  },
  {
    label: 'Paint and Supplies',
    listingUrl: 'https://www.takealot.com/pool-garden/paint-and-supplies-25832',
  },
  {
    label: 'Auto',
    listingUrl: 'https://www.takealot.com/pool-garden/auto',
  },
  {
    label: 'Best Selling Car Care and Cleaning',
    listingUrl: 'https://www.takealot.com/pool-garden/car-care-and-cleaning-25854?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'DIY Tools and Machinery',
    listingUrl: 'https://www.takealot.com/pool-garden/diy-tools-and-machinery-25818',
  },
  {
    label: 'Cordless Power Tools',
    listingUrl: 'https://www.takealot.com/all?dcat=power-tools-cordless',
  },
  {
    label: 'Industrial Power Tools',
    listingUrl: 'https://www.takealot.com/pool-garden/industrial-power-tools-25823',
  },
  {
    label: 'Measuring Tools',
    listingUrl: 'https://www.takealot.com/pool-garden/measuring-tools-25820',
  },
  {
    label: 'Tool Organisers',
    listingUrl: 'https://www.takealot.com/pool-garden/tool-organisers-27436',
  },
  {
    label: 'Workwear and PPE',
    listingUrl: 'https://www.takealot.com/pool-garden/workwear-and-ppe-25829',
  },
  {
    label: 'Safety and Security',
    listingUrl: 'https://www.takealot.com/pool-garden/safety-and-security-25840',
  },
  {
    label: 'New To Takealot Baby and Toddler',
    listingUrl: 'https://www.takealot.com/all?dcat=new-to-tal-baby-and-toddler&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Baby',
    listingUrl: 'https://www.takealot.com/baby',
  },
  {
    label: 'Nappies and Changing',
    listingUrl: 'https://www.takealot.com/baby/nappies_changing',
  },
  {
    label: 'Changing and Feeding',
    listingUrl: 'https://www.takealot.com/baby/changing_feeding',
  },
  {
    label: 'Baby Food and Snacks',
    listingUrl: 'https://www.takealot.com/baby/baby-food-and-snacks-25263?sort=Relevance',
  },
  {
    label: 'Baby and Toddler Toiletries',
    listingUrl: 'https://www.takealot.com/baby/baby-toddler-toiletries',
  },
  {
    label: 'Best Selling Potty Training',
    listingUrl: 'https://www.takealot.com/baby/potty-training-25262?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Maternity Care',
    listingUrl: 'https://www.takealot.com/baby/maternity-care',
  },
  {
    label: 'Care and Nursery',
    listingUrl: 'https://www.takealot.com/baby/care_nursery',
  },
  {
    label: 'Baby Toys and Activity',
    listingUrl: 'https://www.takealot.com/baby/baby-toys-activity',
  },
  {
    label: 'Baby Clothing',
    listingUrl: 'https://www.takealot.com/baby/baby_clothing',
  },
  {
    label: 'Out and About',
    listingUrl: 'https://www.takealot.com/baby/out_and_about',
  },
  {
    label: 'Health and Safety',
    listingUrl: 'https://www.takealot.com/baby/health-and-safety-25318?sort=Relevance',
  },
  {
    label: 'Gift Ideas',
    listingUrl: 'https://www.takealot.com/all?custom=gift-ideas',
  },
  {
    label: 'New To Takealot Beauty',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-beauty&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Sun Shop',
    listingUrl: 'https://www.takealot.com/sun-shop',
  },
  {
    label: 'Dermatological Skincare',
    listingUrl: 'https://www.takealot.com/beauty/dermatological-skincare',
  },
  {
    label: 'Korean Beauty',
    listingUrl: 'https://www.takealot.com/beauty/korean-beauty',
  },
  {
    label: 'Trending Makeup Looks',
    listingUrl: 'https://www.takealot.com/beauty/trending-makeup-looks',
  },
  {
    label: 'Beauty',
    listingUrl: 'https://www.takealot.com/beauty',
  },
  {
    label: 'Luxury Beauty',
    listingUrl: 'https://www.takealot.com/beauty/luxbeauty',
  },
  {
    label: 'Luxury Beauty Fragrances',
    listingUrl: 'https://www.takealot.com/beauty/luxury_beauty_fragrances',
  },
  {
    label: 'Fragrance',
    listingUrl: 'https://www.takealot.com/beauty/fragrance',
  },
  {
    label: 'Makeup',
    listingUrl: 'https://www.takealot.com/beauty/makeup',
  },
  {
    label: 'Skin Care',
    listingUrl: 'https://www.takealot.com/beauty/skin-care',
  },
  {
    label: 'Salon Hair',
    listingUrl: 'https://www.takealot.com/salonhair',
  },
  {
    label: 'Haircare',
    listingUrl: 'https://www.takealot.com/beauty/haircare',
  },
  {
    label: 'Clean Beauty',
    listingUrl: 'https://www.takealot.com/beauty/cleanbeauty',
  },
  {
    label: 'Grooming',
    listingUrl: 'https://www.takealot.com/beauty/grooming',
  },
  {
    label: 'New To Takealot Books',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-book&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Trending Reads',
    listingUrl: 'https://www.takealot.com/books/trending-reads',
  },
  {
    label: 'Books',
    listingUrl: 'https://www.takealot.com/books',
  },
  {
    label: 'Fiction',
    listingUrl: 'https://www.takealot.com/books/fiction',
  },
  {
    label: 'Children Books',
    listingUrl: 'https://www.takealot.com/books/children',
  },
  {
    label: 'Nonfiction',
    listingUrl: 'https://www.takealot.com/books/nonfiction',
  },
  {
    label: 'Cookbooks',
    listingUrl: 'https://www.takealot.com/books/cookbooks',
  },
  {
    label: 'Top Rated Book Boxsets',
    listingUrl: 'https://www.takealot.com/all?custom=books-boxsets&sort=Rating%20Descending',
  },
  {
    label: 'Christian Books',
    listingUrl: 'https://www.takealot.com/books/books_christian',
  },
  {
    label: 'Bestsellers',
    listingUrl: 'https://www.takealot.com/all?custom=bestsellers&sort=Rating%20Descending',
  },
  {
    label: 'Top YA',
    listingUrl: 'https://www.takealot.com/all?custom=top-ya-&sort=Rating%20Descending',
  },
  {
    label: 'Academic Books',
    listingUrl: 'https://www.takealot.com/books/academic',
  },
  {
    label: 'New To Takealot Camping',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-camping&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Camping and Outdoor',
    listingUrl: 'https://www.takealot.com/camping-outdoor',
  },
  {
    label: 'Tents',
    listingUrl: 'https://www.takealot.com/camping-outdoor/tents-25681',
  },
  {
    label: 'Camping Furniture',
    listingUrl: 'https://www.takealot.com/camping-outdoor/camping-furniture-25614',
  },
  {
    label: 'Lighting',
    listingUrl: 'https://www.takealot.com/camping-outdoor/lighting-25624',
  },
  {
    label: 'Sleeping Gear',
    listingUrl: 'https://www.takealot.com/camping-outdoor/sleeping-gear-25661',
  },
  {
    label: 'Coolers and Refrigeration',
    listingUrl: 'https://www.takealot.com/camping-outdoor/coolers-and-refrigeration-25641',
  },
  {
    label: 'Top Rated Beach and Water Activities',
    listingUrl: 'https://www.takealot.com/camping-outdoor/beach-and-water-activities-25711?filter=Available:true&sort=Rating%20Descending',
  },
  {
    label: 'Fishing',
    listingUrl: 'https://www.takealot.com/camping-outdoor/fishing-25712',
  },
  {
    label: 'Top Rated Hiking',
    listingUrl: 'https://www.takealot.com/camping-outdoor/hiking-25719?filter=Available:true&sort=Rating%20Descending',
  },
  {
    label: 'New Hunting',
    listingUrl: 'https://www.takealot.com/camping-outdoor/hunting-25718?filter=Available:true&sort=ReleaseDate%20Descending',
  },
  {
    label: 'New To Takealot Fashion',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-fashion&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Denim World',
    listingUrl: 'https://www.takealot.com/denim-world',
  },
  {
    label: 'Fresh Fashion',
    listingUrl: 'https://www.takealot.com/fresh-fashion',
  },
  {
    label: 'Fashion Outlet',
    listingUrl: 'https://www.takealot.com/fashion/outletstore',
  },
  {
    label: 'Fashion',
    listingUrl: 'https://www.takealot.com/fashion',
  },
  {
    label: 'Women Fashion',
    listingUrl: 'https://www.takealot.com/fashion/women',
  },
  {
    label: 'Men Fashion',
    listingUrl: 'https://www.takealot.com/fashion/men',
  },
  {
    label: 'Kids Fashion',
    listingUrl: 'https://www.takealot.com/fashion/kids',
  },
  {
    label: 'New Watches',
    listingUrl: 'https://www.takealot.com/fashion/watches-33009?sort=ReleaseDate%20Descending',
  },
  {
    label: 'New Jewellery',
    listingUrl: 'https://www.takealot.com/fashion/jewellery-32909?sort=ReleaseDate%20Descending',
  },
  {
    label: 'New Footwear',
    listingUrl: 'https://www.takealot.com/fashion/footwear-32868?sort=ReleaseDate%20Descending',
  },
  {
    label: 'New To Takealot Luggage',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-luggage&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Luggage and Travel',
    listingUrl: 'https://www.takealot.com/luggage-travel',
  },
  {
    label: 'Best Selling Suitcases',
    listingUrl: 'https://www.takealot.com/luggage-travel/suitcases-25494?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Business Bags',
    listingUrl: 'https://www.takealot.com/luggage-travel/business-bags-25508?sort=Relevance',
  },
  {
    label: 'Backpacks and Duffels',
    listingUrl: 'https://www.takealot.com/luggage-travel/backpacks-and-duffels-25495?sort=Relevance',
  },
  {
    label: 'Wallets and Purses',
    listingUrl: 'https://www.takealot.com/luggage-travel/walletsandpurses',
  },
  {
    label: 'New In Electronics',
    listingUrl: 'https://www.takealot.com/all?custom=new-in-electronics&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Vlogging',
    listingUrl: 'https://www.takealot.com/cameras/vlogging',
  },
  {
    label: 'TV Audio and Video',
    listingUrl: 'https://www.takealot.com/tv-audio-video',
  },
  {
    label: 'Cellular and GPS',
    listingUrl: 'https://www.takealot.com/cellular-gps',
  },
  {
    label: 'Laptops',
    listingUrl: 'https://www.takealot.com/computers/laptops',
  },
  {
    label: 'Wearable Tech',
    listingUrl: 'https://www.takealot.com/cellular-gps/wearabletech',
  },
  {
    label: 'Computers',
    listingUrl: 'https://www.takealot.com/computers',
  },
  {
    label: 'Computer Monitors and Accessories',
    listingUrl: 'https://www.takealot.com/computers/computer-monitors-and-accessories-27166',
  },
  {
    label: 'Top Rated Components',
    listingUrl: 'https://www.takealot.com/computers/components-26415?sort=Rating%20Descending',
  },
  {
    label: 'Tablets and Kindles',
    listingUrl: 'https://www.takealot.com/computers/tablets_and_kindles',
  },
  {
    label: 'Cameras',
    listingUrl: 'https://www.takealot.com/cameras',
  },
  {
    label: 'Drones',
    listingUrl: 'https://www.takealot.com/cameras/drones-26441',
  },
  {
    label: 'Smart Home',
    listingUrl: 'https://www.takealot.com/computers/smarthome',
  },
  {
    label: 'New To Takealot Gaming',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-gaming&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Gaming',
    listingUrl: 'https://www.takealot.com/gaming',
  },
  {
    label: 'PlayStation 5',
    listingUrl: 'https://www.takealot.com/gaming/playstation5',
  },
  {
    label: 'Xbox Series',
    listingUrl: 'https://www.takealot.com/promotion/xboxseries',
  },
  {
    label: 'Nintendo',
    listingUrl: 'https://www.takealot.com/gaming/nintendo',
  },
  {
    label: 'PC Gaming',
    listingUrl: 'https://www.takealot.com/gaming/pc',
  },
  {
    label: 'Games and Accessories',
    listingUrl: 'https://www.takealot.com/gaming/gamesaccessories',
  },
  {
    label: 'Gaming Merchandise',
    listingUrl: 'https://www.takealot.com/gaming/gamingmerch',
  },
  {
    label: 'Movies',
    listingUrl: 'https://www.takealot.com/movies',
  },
  {
    label: 'Movie Merchandise',
    listingUrl: 'https://www.takealot.com/movies/movie-merchandise-28492?filter=Available:true&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Music',
    listingUrl: 'https://www.takealot.com/music',
  },
  {
    label: 'Musical Instruments',
    listingUrl: 'https://www.takealot.com/music/musicalinstruments',
  },
  {
    label: 'New To Takealot Garden Pool and Patio',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-gpp&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Pool and Garden',
    listingUrl: 'https://www.takealot.com/pool-garden',
  },
  {
    label: 'Braai',
    listingUrl: 'https://www.takealot.com/pool-garden/braai_new',
  },
  {
    label: 'Charcoal',
    listingUrl: 'https://www.takealot.com/pool-garden/charcoal-25902',
  },
  {
    label: 'Gas',
    listingUrl: 'https://www.takealot.com/pool-garden/gas-25903',
  },
  {
    label: 'Braai Accessories',
    listingUrl: 'https://www.takealot.com/pool-garden/braai-accessories-28417',
  },
  {
    label: 'Patio',
    listingUrl: 'https://www.takealot.com/pool-garden/patio_new',
  },
  {
    label: 'Patio Furniture',
    listingUrl: 'https://www.takealot.com/pool-garden/patio-furniture-25874?sort=ReleaseDate%20Descending',
  },
  {
    label: 'Patio Heaters',
    listingUrl: 'https://www.takealot.com/pool-garden/patio-heaters-25895?sort=ReleaseDate%20Descending',
  },
  {
    label: 'Outdoor Lighting',
    listingUrl: 'https://www.takealot.com/pool-garden/outdoor-lighting-25896?sort=ReleaseDate%20Descending',
  },
  {
    label: 'Garden',
    listingUrl: 'https://www.takealot.com/pool-garden/garden1',
  },
  {
    label: 'Top Rated Gardening Tools',
    listingUrl: 'https://www.takealot.com/pool-garden/gardening-tools-25923?sort=Rating%20Descending',
  },
  {
    label: 'Seeds and Bulbs',
    listingUrl: 'https://www.takealot.com/pool-garden/seeds-and-bulbs-28645?sort=Relevance',
  },
  {
    label: 'Garden Sheds and Storage',
    listingUrl: 'https://www.takealot.com/pool-garden/garden-sheds-and-storage-25932?sort=ReleaseDate%20Descending',
  },
  {
    label: 'Pool',
    listingUrl: 'https://www.takealot.com/pool-garden/pool1',
  },
  {
    label: 'Top Rated Pool Cleaners and Accessories',
    listingUrl: 'https://www.takealot.com/pool-garden/pool-cleaners-and-accessories-25943?sort=Rating%20Descending',
  },
  {
    label: 'Swimming Aids and Inflatables',
    listingUrl: 'https://www.takealot.com/pool-garden/swimming-aids-and-inflatables-25942?sort=ReleaseDate%20Descending',
  },
  {
    label: 'New To Takealot Groceries and Household',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-groceries-and-household&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Alot For Less',
    listingUrl: 'https://www.takealot.com/alot-for-less',
  },
  {
    label: 'Food Cupboard',
    listingUrl: 'https://www.takealot.com/home-kitchen/foodcupboard',
  },
  {
    label: 'Top Rated Snacks',
    listingUrl: 'https://www.takealot.com/health/snacks-28124?sort=Rating%20Descending',
  },
  {
    label: 'Biscuits Rusks and Crackers',
    listingUrl: 'https://www.takealot.com/home-kitchen/biscuits-rusks-and-crackers-31685?filter=Available:true&sort=Relevance',
  },
  {
    label: 'Breakfast Cereals and Bars',
    listingUrl: 'https://www.takealot.com/home-kitchen/breakfast-cereals-and-bars-31754?filter=Available:true&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Baking Supplies and Sugar Alternatives',
    listingUrl: 'https://www.takealot.com/home-kitchen/baking-supplies-sugar-and-sugar-alternatives-31759?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Tea Coffee and Hot Drinks',
    listingUrl: 'https://www.takealot.com/home-kitchen/tea-coffee-and-hot-drinks-31738?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Condiments Spices and Sauces',
    listingUrl: 'https://www.takealot.com/home-kitchen/condiments-spices-and-sauces-31764?filter=Available:true&sort=Relevance',
  },
  {
    label: 'Household Cleaning',
    listingUrl: 'https://www.takealot.com/home-kitchen/householdcleaning',
  },
  {
    label: 'Dishwashing',
    listingUrl: 'https://www.takealot.com/home-kitchen/dishwashing-28707',
  },
  {
    label: 'All Purpose Cleaners',
    listingUrl: 'https://www.takealot.com/home-kitchen/all-purpose-cleaners-28701?filter=Available:true&sort=Relevance',
  },
  {
    label: 'Best Selling Floor Cleaners',
    listingUrl: 'https://www.takealot.com/home-kitchen/floor-cleaners-28719?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'New To Takealot Health',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-health&sort=ReleaseDate%20Descending',
  },
  {
    label: 'The Wellness Store',
    listingUrl: 'https://www.takealot.com/health/thewellnessstore',
  },
  {
    label: 'Sports Nutrition',
    listingUrl: 'https://www.takealot.com/health/sportsnutrition',
  },
  {
    label: 'Health',
    listingUrl: 'https://www.takealot.com/health',
  },
  {
    label: 'Top Rated Vitamins and Supplements',
    listingUrl: 'https://www.takealot.com/health/vitamins-and-supplements-27052?filter=Available:true&sort=Rating%20Descending',
  },
  {
    label: 'Top Rated Health Food',
    listingUrl: 'https://www.takealot.com/health/health-food-25223?filter=Available:true&sort=Rating%20Descending',
  },
  {
    label: 'Best Selling First Aid',
    listingUrl: 'https://www.takealot.com/health/first-aid-25220?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Health Equipment',
    listingUrl: 'https://www.takealot.com/health/health-equipment-25225?sort=Relevance',
  },
  {
    label: 'Medicine and Treatments',
    listingUrl: 'https://www.takealot.com/health/medicine-and-treatments-25229',
  },
  {
    label: 'Sexual Health',
    listingUrl: 'https://www.takealot.com/health/sexualhealth',
  },
  {
    label: 'Personal Care',
    listingUrl: 'https://www.takealot.com/health/personalcare',
  },
  {
    label: 'Sun Protection and Care',
    listingUrl: 'https://www.takealot.com/health/sun-protection-and-care-27080?sort=Relevance',
  },
  {
    label: 'Deodorant',
    listingUrl: 'https://www.takealot.com/health/deodorant-27079?sort=Relevance',
  },
  {
    label: 'Lip and Skin Care',
    listingUrl: 'https://www.takealot.com/health/lip-and-skin-care-27074?sort=ReleaseDate%20Descending',
  },
  {
    label: 'New To Takealot Homeware',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-homeware&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Home and Kitchen',
    listingUrl: 'https://www.takealot.com/home-kitchen',
  },
  {
    label: 'Cookware',
    listingUrl: 'https://www.takealot.com/home-kitchen/cookware_',
  },
  {
    label: 'Kitchen Tools',
    listingUrl: 'https://www.takealot.com/kitchen-tools',
  },
  {
    label: 'Cutlery',
    listingUrl: 'https://www.takealot.com/cutlery',
  },
  {
    label: 'Drinkware',
    listingUrl: 'https://www.takealot.com/drinkware',
  },
  {
    label: 'Kitchen Storage',
    listingUrl: 'https://www.takealot.com/home-kitchen/kitchen-storage-26156?sort=ReleaseDate%20Descending',
  },
  {
    label: 'Home Decor',
    listingUrl: 'https://www.takealot.com/home-decor',
  },
  {
    label: 'Linen and Sheets',
    listingUrl: 'https://www.takealot.com/home-kitchen/linen-and-sheets-26027?sort=ReleaseDate%20Descending',
  },
  {
    label: 'Bathroom Accessories',
    listingUrl: 'https://www.takealot.com/bathroom-accessories',
  },
  {
    label: 'Furniture',
    listingUrl: 'https://www.takealot.com/furniture',
  },
  {
    label: 'Living Room Furniture',
    listingUrl: 'https://www.takealot.com/home-kitchen/living-room-furniture-26984?sort=Relevance',
  },
  {
    label: 'Dining Room Furniture',
    listingUrl: 'https://www.takealot.com/home-kitchen/dining-room-furniture-26964?sort=Relevance',
  },
  {
    label: 'Bedroom Furniture',
    listingUrl: 'https://www.takealot.com/home-kitchen/bedroom-furniture-26940?sort=Relevance',
  },
  {
    label: 'Study and Home Office Furniture',
    listingUrl: 'https://www.takealot.com/home-kitchen/study-and-home-office-furniture-26996?sort=ReleaseDate%20Descending',
  },
  {
    label: 'Installation Services Vouchers',
    listingUrl: 'https://www.takealot.com/pool-garden/installation-services-vouchers-33375',
  },
  {
    label: 'New To Takealot Liquor',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-liquor&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Liquor',
    listingUrl: 'https://www.takealot.com/home-kitchen/liquor',
  },
  {
    label: 'Wine',
    listingUrl: 'https://www.takealot.com/home-kitchen/wine',
  },
  {
    label: 'Beer',
    listingUrl: 'https://www.takealot.com/home-kitchen/beer',
  },
  {
    label: 'Whisky',
    listingUrl: 'https://www.takealot.com/home-kitchen/whisky',
  },
  {
    label: 'Cognac',
    listingUrl: 'https://www.takealot.com/home-kitchen/cognac-25193?sort=Relevance',
  },
  {
    label: 'Brandy',
    listingUrl: 'https://www.takealot.com/home-kitchen/brandy-25191?sort=Relevance',
  },
  {
    label: 'Best Selling Gin',
    listingUrl: 'https://www.takealot.com/home-kitchen/gin-25194?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Vodka',
    listingUrl: 'https://www.takealot.com/home-kitchen/vodka-25199?sort=ReleaseDate%20Descending',
  },
  {
    label: 'Top Rated Tequila',
    listingUrl: 'https://www.takealot.com/home-kitchen/tequila-25198?sort=Rating%20Descending',
  },
  {
    label: 'Liqueurs and Aperitifs',
    listingUrl: 'https://www.takealot.com/home-kitchen/liqueurs-and-aperitifs-25196',
  },
  {
    label: 'Non Alcoholic',
    listingUrl: 'https://www.takealot.com/home-kitchen/non-alcoholic-25183?sort=Relevance',
  },
  {
    label: 'New To Takealot Stationery and Office',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-stationery-and-office&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Office',
    listingUrl: 'https://www.takealot.com/office-stationery/office',
  },
  {
    label: 'Office Furniture',
    listingUrl: 'https://www.takealot.com/office-stationery/office-furniture-26363',
  },
  {
    label: 'Office Consumables',
    listingUrl: 'https://www.takealot.com/office-stationery/office-consumables-26324',
  },
  {
    label: 'Printing',
    listingUrl: 'https://www.takealot.com/computers/printing',
  },
  {
    label: 'Office Supplies',
    listingUrl: 'https://www.takealot.com/office-stationery/office-supplies-26579',
  },
  {
    label: 'Student',
    listingUrl: 'https://www.takealot.com/office-stationery/student',
  },
  {
    label: 'Arts and Crafts',
    listingUrl: 'https://www.takealot.com/office-stationery/arts_crafts',
  },
  {
    label: 'Top Rated Paper',
    listingUrl: 'https://www.takealot.com/office-stationery/paper-26590?sort=Rating%20Descending',
  },
  {
    label: 'Pens and Refills',
    listingUrl: 'https://www.takealot.com/office-stationery/pens-and-refills-26637',
  },
  {
    label: 'Top Rated Colouring',
    listingUrl: 'https://www.takealot.com/office-stationery/colouring-26643?filter=Available:true&sort=Rating%20Descending',
  },
  {
    label: 'Fine Writing',
    listingUrl: 'https://www.takealot.com/office-stationery/fine-writing-26642?filter=Available:true&sort=Price%20Descending',
  },
  {
    label: 'Top Rated Technical Instruments',
    listingUrl: 'https://www.takealot.com/office-stationery/technical-instruments-26608?sort=Rating%20Descending',
  },
  {
    label: 'New To Takealot Pets',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-pets&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Pets Character Shop',
    listingUrl: 'https://www.takealot.com/all?custom=pets-character-shop',
  },
  {
    label: 'Vet Store',
    listingUrl: 'https://www.takealot.com/promotion/vetstore',
  },
  {
    label: 'Pets',
    listingUrl: 'https://www.takealot.com/pets',
  },
  {
    label: 'Dog Supplies',
    listingUrl: 'https://www.takealot.com/pets/dogsupplies',
  },
  {
    label: 'Cat Supplies',
    listingUrl: 'https://www.takealot.com/pets/catsupplies',
  },
  {
    label: 'Fish',
    listingUrl: 'https://www.takealot.com/pets/all?filter=AnimalType:Fish&filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Hamster Rat and Guinea Pig',
    listingUrl: 'https://www.takealot.com/pets/all?filter=AnimalType:Hamster|Rat|Guinea%20Pig&filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Rabbit',
    listingUrl: 'https://www.takealot.com/pets/all?filter=AnimalType:Rabbit&filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Reptile',
    listingUrl: 'https://www.takealot.com/pets/all?filter=AnimalType:Reptile&filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Goats Sheep and Cattle',
    listingUrl: 'https://www.takealot.com/pets/all?filter=AnimalType:Goats|Sheep|Cattle&filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Horse',
    listingUrl: 'https://www.takealot.com/pets/all?filter=AnimalType:Horse&filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Bird',
    listingUrl: 'https://www.takealot.com/pets/all?filter=AnimalType:Bird&filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'New To Takealot Sport',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-sport&sort=ReleaseDate%20Descending',
  },
  {
    label: 'SuperSport Schools',
    listingUrl: 'https://www.takealot.com/sport/supersport-schools',
  },
  {
    label: 'PSL',
    listingUrl: 'https://www.takealot.com/psl',
  },
  {
    label: 'New Clearance Store',
    listingUrl: 'https://www.takealot.com/sport/newclearancestore',
  },
  {
    label: 'Sport',
    listingUrl: 'https://www.takealot.com/sport',
  },
  {
    label: 'Sports Clothing',
    listingUrl: 'https://www.takealot.com/sport/sports-clothing',
  },
  {
    label: 'Sports Footwear',
    listingUrl: 'https://www.takealot.com/sport/sports-footwear',
  },
  {
    label: 'Team Sports',
    listingUrl: 'https://www.takealot.com/sport/teamsports',
  },
  {
    label: 'Runners Checklist',
    listingUrl: 'https://www.takealot.com/sport/runnerschecklist',
  },
  {
    label: 'Cycling Store',
    listingUrl: 'https://www.takealot.com/sport/cyclingstore',
  },
  {
    label: 'Beach and Outdoor Games',
    listingUrl: 'https://www.takealot.com/sport/beach-outdoor-games',
  },
  {
    label: 'Exercise',
    listingUrl: 'https://www.takealot.com/sport/newexercise',
  },
  {
    label: 'Tennis',
    listingUrl: 'https://www.takealot.com/sport/tennis',
  },
  {
    label: 'Cricket',
    listingUrl: 'https://www.takealot.com/sport/cricket',
  },
  {
    label: 'Takealot Fan Gear',
    listingUrl: 'https://www.takealot.com/sport/takealot-fan-gear',
  },
  {
    label: 'Hockey',
    listingUrl: 'https://www.takealot.com/sport/hockey',
  },
  {
    label: 'New To Takealot Toys',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-toys&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Toys',
    listingUrl: 'https://www.takealot.com/toys',
  },
  {
    label: 'Action Figures',
    listingUrl: 'https://www.takealot.com/toys/actionfigures',
  },
  {
    label: 'Board Games',
    listingUrl: 'https://www.takealot.com/toys/boardgames',
  },
  {
    label: 'Card Games',
    listingUrl: 'https://www.takealot.com/toys/card-games-25354?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Indoor Play',
    listingUrl: 'https://www.takealot.com/toys/indoor-play-25402?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Kids Party Supplies',
    listingUrl: 'https://www.takealot.com/toys/kids-party-supplies-25480?filter=Available:true&sort=BestSelling%20Descending',
  },
  {
    label: 'Top Rated Outdoor Play',
    listingUrl: 'https://www.takealot.com/toys/outdoor-play-25380?sort=Rating%20Descending',
  },
  {
    label: 'Puzzles',
    listingUrl: 'https://www.takealot.com/toys/puzzles',
  },
  {
    label: 'Smart and Interactive Toys',
    listingUrl: 'https://www.takealot.com/toys/smart-and-interactive-toys-25363?sort=ReleaseDate%20Descending',
  },
] as const;
const FEATURED_GROUP_ORDER: FeaturedGroup[] = [
  'Appliances',
  'DIY & Auto',
  'Baby',
  'Beauty',
  'Books',
  'Outdoor',
  'Fashion',
  'Travel',
  'Electronics',
  'Gaming & Media',
  'Garden & Pool',
  'Groceries',
  'Health',
  'Homeware',
  'Liquor',
  'Office',
  'Pets',
  'Sport',
  'Toys',
  'General',
];
const FEATURED_GROUP_COPY: Record<FeaturedGroup, string> = {
  Appliances: 'Kitchen and appliance feeds suited to new-in, top-rated, and practical household sourcing.',
  'DIY & Auto': 'Tools, auto parts, workshop supplies, and maintenance-led categories with repeat demand.',
  Baby: 'Baby care, feeding, nursery, and parenting-led categories where trust and review depth matter.',
  Beauty: 'Beauty, skincare, fragrances, and grooming trends that benefit from fast variation analysis.',
  Books: 'Books and reading-led categories where trend, bestseller, and genre pockets move differently.',
  Outdoor: 'Camping and outdoor categories with seasonality, bundles, and accessory-driven upsells.',
  Fashion: 'Fashion-led discovery feeds for apparel, watches, jewelry, and footwear.',
  Travel: 'Travel and luggage categories including suitcases, backpacks, wallets, and business bags.',
  Electronics: 'Electronics, computing, cellular, wearables, and smart-home categories.',
  'Gaming & Media': 'Gaming hardware, accessories, movies, music, and media-adjacent feeds.',
  'Garden & Pool': 'Patio, braai, garden, and pool categories for home-improvement and seasonal sourcing.',
  Groceries: 'Household, pantry, snacks, and cleaning categories with velocity and replenishment potential.',
  Health: 'Health, supplements, wellness, and personal-care categories with strong repeat-purchase behavior.',
  Homeware: 'Furniture, decor, cookware, drinkware, and broader home-living categories.',
  Liquor: 'Liquor and beverage categories where brand and format matter more than deep spec analysis.',
  Office: 'Office, stationery, printing, school, and craft-led supplies.',
  Pets: 'Pet supplies and animal-type feeds for consumables, accessories, and niche care.',
  Sport: 'Sporting goods, apparel, footwear, and fan-driven categories.',
  Toys: 'Toys, games, outdoor play, and interactive products for seasonal and gifting demand.',
  General: 'Promotions, gift ideas, and broader marketplace feeds that do not fit a single department.',
};

function resolveFeaturedGroup(listingUrl: string, label: string): FeaturedGroup {
  const url = listingUrl.toLowerCase();
  const text = `${label.toLowerCase()} ${url}`;

  if (/appliances|airfryer|kettle|blender|microwave|fridge|dishwasher|stoves|oven|washing|dryer|vacuum|coffee-machines/.test(text)) return 'Appliances';
  if (/diy|auto|paint|tool|power-tools|workwear|security|car-care|industrial/.test(text)) return 'DIY & Auto';
  if (/\/baby|maternity|nursery|nappies|potty|baby /.test(text)) return 'Baby';
  if (/beauty|grooming|fragrance|makeup|skin-care|haircare|sun-shop|salonhair/.test(text)) return 'Beauty';
  if (/\/books|book|fiction|nonfiction|cookbooks|academic|christian|bestsellers|top-ya/.test(text)) return 'Books';
  if (/camping-outdoor|tents|hiking|fishing|hunting|sleeping gear|coolers/.test(text)) return 'Outdoor';
  if (/fashion|denim|footwear|jewellery|watches|fresh-fashion/.test(text)) return 'Fashion';
  if (/luggage-travel|suitcases|wallets|business bags|backpacks and duffels/.test(text)) return 'Travel';
  if (/electronics|computers|cameras|cellular-gps|tv-audio-video|laptops|tablets|wearable|drones|smart home|printing/.test(text)) return 'Electronics';
  if (/gaming|playstation|xbox|nintendo|movies|music|musicalinstruments|media|psl/.test(text)) return 'Gaming & Media';
  if (/pool-garden|patio|braai|charcoal|gas|garden|pool|outdoor-lighting|swimming/.test(text)) return 'Garden & Pool';
  if (/groceries|foodcupboard|snacks|biscuits|cereals|baking|tea-coffee|condiments|householdcleaning|dishwashing|cleaners|alot-for-less/.test(text)) return 'Groceries';
  if (/health|wellness|vitamins|supplements|sportsnutrition|first-aid|sexualhealth|personalcare|deodorant|lip-and-skin-care/.test(text)) return 'Health';
  if (/home-kitchen|home-decor|bathroom-accessories|furniture|cookware_|kitchen-tools|cutlery|drinkware|linen/.test(text)) return 'Homeware';
  if (/liquor|wine|beer|whisky|cognac|brandy|gin|vodka|tequila|liqueurs|non-alcoholic/.test(text)) return 'Liquor';
  if (/office-stationery|office|student|paper|pens|colouring|technical-instruments|arts_crafts/.test(text)) return 'Office';
  if (/\/pets|vetstore|dogsupplies|catsupplies|animaltype/.test(text)) return 'Pets';
  if (/\/sport|supersport|sports-clothing|sports-footwear|teamsports|cycling|tennis|cricket|hockey|fan-gear/.test(text)) return 'Sport';
  if (/\/toys|actionfigures|boardgames|card-games|indoor-play|outdoor-play|puzzles|interactive-toys/.test(text)) return 'Toys';
  return 'General';
}

function buildProductOfferParams(value: string): {
  description?: string;
  productUrl?: string;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    if (url.hostname.includes(TAKEALOT_HOST_SNIPPET)) {
      return { productUrl: url.toString() };
    }
  } catch {
    // Not a valid URL, fall back to description.
  }

  return { description: trimmed };
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const stored = window.localStorage.getItem('app-theme');
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState<boolean>(false);
  const [productSearchError, setProductSearchError] = useState<string | null>(null);
  const [hasSearchedSeller, setHasSearchedSeller] = useState<boolean>(false);
  const [catalogQuery, setCatalogQuery] = useState<string>('');

  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productOffers, setProductOffers] = useState<ProductOfferSummary | null>(null);
  const [productOfferError, setProductOfferError] = useState<string | null>(null);
  const [productResultsError, setProductResultsError] = useState<string | null>(null);
  const [productDiscoveryError, setProductDiscoveryError] = useState<string | null>(null);
  const [isSearchingProductResults, setIsSearchingProductResults] = useState<boolean>(false);
  const [isLoadingSelectedProduct, setIsLoadingSelectedProduct] = useState<boolean>(false);
  const [isLoadingProductDiscovery, setIsLoadingProductDiscovery] = useState<boolean>(false);
  const [isLoadingMoreProductResults, setIsLoadingMoreProductResults] = useState<boolean>(false);
  const [hasSearchedOffers, setHasSearchedOffers] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [lastProductQuery, setLastProductQuery] = useState<string>('');
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);

  const [productResultPages, setProductResultPages] = useState<Product[][]>([]);
  const [productResultsNextAfter, setProductResultsNextAfter] = useState<string | null>(null);
  const [currentProductResultsPage, setCurrentProductResultsPage] = useState<number>(0);

  const [discoveryPages, setDiscoveryPages] = useState<Product[][]>([]);
  const [currentDiscoveryPage, setCurrentDiscoveryPage] = useState<number>(0);
  const [hasMoreDiscoveryProducts, setHasMoreDiscoveryProducts] = useState<boolean>(false);
  const [selectedFeaturedList, setSelectedFeaturedList] = useState<string | null>(null);
  const [featuredListNextAfter, setFeaturedListNextAfter] = useState<string | null>(null);
  const [selectedFeaturedGroup, setSelectedFeaturedGroup] = useState<FeaturedGroup>('Appliances');
  const [featuredListQuery, setFeaturedListQuery] = useState<string>('');

  const [searchMode, setSearchMode] = useState<SearchMode>('seller');

  useEffect(() => {
    if (!isProductModalOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProductModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isProductModalOpen]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('app-theme', theme);
  }, [theme]);

  const featuredGroups = useMemo(() => {
    const counts = new Map<FeaturedGroup, number>();
    FEATURED_LISTS.forEach((item) => {
      const group = resolveFeaturedGroup(item.listingUrl, item.label);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    });

    return FEATURED_GROUP_ORDER.filter((group) => counts.has(group)).map((group) => ({
      group,
      count: counts.get(group) ?? 0,
      description: FEATURED_GROUP_COPY[group],
    }));
  }, []);

  const featuredGroupItems = useMemo(() => {
    const items = FEATURED_LISTS.filter((item) => resolveFeaturedGroup(item.listingUrl, item.label) === selectedFeaturedGroup);
    if (!featuredListQuery.trim()) {
      return items;
    }

    const needle = featuredListQuery.trim().toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(needle) || item.listingUrl.toLowerCase().includes(needle));
  }, [featuredListQuery, selectedFeaturedGroup]);

  const handleLoadDiscoveryProducts = useCallback(async () => {
    if (isLoadingProductDiscovery) {
      return;
    }

    const selectedListingUrl = selectedFeaturedList ?? FEATURED_LISTS[0]?.listingUrl;
    if (!selectedListingUrl) {
      return;
    }

    if (currentDiscoveryPage < discoveryPages.length - 1) {
      setCurrentDiscoveryPage((current) => current + 1);
      return;
    }

    setIsLoadingProductDiscovery(true);
    setProductDiscoveryError(null);

    try {
      const featured = await fetchListingProducts(
        selectedListingUrl,
        currentDiscoveryPage === 0 && discoveryPages.length === 0 ? undefined : featuredListNextAfter ?? undefined
      );
      setDiscoveryPages((current) => [...current, featured.products]);
      setCurrentDiscoveryPage(discoveryPages.length);
      setHasMoreDiscoveryProducts(Boolean(featured.meta?.nextAfter));
      setFeaturedListNextAfter(featured.meta?.nextAfter ?? null);
    } catch (error) {
      console.error('Error loading product opportunities:', error);
      setProductDiscoveryError('Recommended products took too long to load. You can still search manually.');
    } finally {
      setIsLoadingProductDiscovery(false);
    }
  }, [currentDiscoveryPage, discoveryPages.length, featuredListNextAfter, isLoadingProductDiscovery, selectedFeaturedList]);

  const handleSelectFeaturedList = useCallback(async (listingUrl: string) => {
    setSelectedFeaturedList(listingUrl);
    setDiscoveryPages([]);
    setCurrentDiscoveryPage(0);
    setHasMoreDiscoveryProducts(false);
    setFeaturedListNextAfter(null);

    if (isLoadingProductDiscovery) {
      return;
    }

    setIsLoadingProductDiscovery(true);
    setProductDiscoveryError(null);

    try {
      const featured = await fetchListingProducts(listingUrl);
      setDiscoveryPages([featured.products]);
      setCurrentDiscoveryPage(0);
      setHasMoreDiscoveryProducts(Boolean(featured.meta?.nextAfter));
      setFeaturedListNextAfter(featured.meta?.nextAfter ?? null);
    } catch (error) {
      console.error('Error loading featured list:', error);
      setProductDiscoveryError('Unable to load that featured list right now.');
    } finally {
      setIsLoadingProductDiscovery(false);
    }
  }, [isLoadingProductDiscovery]);

  const handleClearFeaturedList = useCallback(() => {
    setSelectedFeaturedList(null);
    setDiscoveryPages([]);
    setCurrentDiscoveryPage(0);
    setHasMoreDiscoveryProducts(false);
    setFeaturedListNextAfter(null);
    setProductDiscoveryError(null);
    setSelectedProductId(null);
  }, []);

  const handleSellerSearch = useCallback(async (sellerId: string) => {
    if (!sellerId) return;

    setHasSearchedSeller(true);
    setIsSearchingProducts(true);
    setProducts([]);
    setProductSearchError(null);
    setCatalogQuery('');

    try {
      const fetchedProducts = await fetchSellerProducts(sellerId);
      if (fetchedProducts.length === 0) {
        setProductSearchError('No products found for this seller. Please check the details and try again.');
      } else {
        setProducts(fetchedProducts);
      }
    } catch (error) {
      console.error('Error fetching seller products:', error);
      setProductSearchError('An error occurred while searching for products. Please try again.');
    } finally {
      setIsSearchingProducts(false);
    }
  }, []);

  const handleProductSearch = useCallback(async (input: string) => {
    if (!input) return;

    const params = buildProductOfferParams(input);
    if (!params.description && !params.productUrl) {
      setProductOfferError('Please provide a product description or a valid Takealot product URL.');
      return;
    }

    setHasSearchedOffers(true);
    setIsSearchingProductResults(true);
    setLastProductQuery(input.trim());
    setProductResults([]);
    setProductResultPages([]);
    setSelectedProductId(null);
    setIsProductModalOpen(false);
    setProductOffers(null);
    setProductOfferError(null);
    setProductResultsError(null);
    setProductResultsNextAfter(null);
    setCurrentProductResultsPage(0);

    try {
      if (params.productUrl) {
        const summary = await fetchProductOffers(params);
        setProductOffers(summary);
        setSelectedProductId(summary.product.id);
        setIsProductModalOpen(true);

        const directResult = [
          {
            id: summary.product.id,
            name: summary.product.name,
            description: '',
            price: summary.offers[0]?.price ?? 0,
            currency: summary.offers[0]?.currency ?? 'R',
            imageUrl: summary.product.imageUrl ?? '',
            productUrl: summary.product.productUrl,
            sellerId: '',
          },
        ];

        setProductResults(directResult);
        setProductResultPages([directResult]);
      } else {
        const results = await fetchProductSearchResults(params.description ?? '');
        if (results.products.length === 0) {
          setProductResultsError('No products matched that search. Try a more specific product name.');
        } else {
          setProductResults(results.products);
          setProductResultPages([results.products]);
          setProductResultsNextAfter(results.meta?.nextAfter ?? null);
        }
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProductResultsError('Unable to search Takealot products right now.');
    } finally {
      setIsSearchingProductResults(false);
    }
  }, []);

  const handleInspectProduct = useCallback(async (product: Product) => {
    setSelectedProductId(product.id);
    setIsLoadingSelectedProduct(true);
    setProductOfferError(null);
    setProductOffers(null);
    setIsProductModalOpen(true);

    try {
      const summary = await fetchProductOffers({ productUrl: product.productUrl });
      setProductOffers(summary);
    } catch (error) {
      console.error('Error fetching selected product offers:', error);
      setProductOfferError("Unable to load the selected product's offer breakdown.");
    } finally {
      setIsLoadingSelectedProduct(false);
    }
  }, []);

  const handleInspectVariant = useCallback(async (productUrl: string) => {
    setIsLoadingSelectedProduct(true);
    setProductOfferError(null);
    setProductOffers(null);
    setIsProductModalOpen(true);

    try {
      const summary = await fetchProductOffers({ productUrl });
      setSelectedProductId(summary.product.id);
      setProductOffers(summary);
    } catch (error) {
      console.error('Error fetching selected product variant offers:', error);
      setProductOfferError("Unable to load the selected variation's offer breakdown.");
    } finally {
      setIsLoadingSelectedProduct(false);
    }
  }, []);

  const handleNextProductResultsPage = useCallback(async () => {
    if (currentProductResultsPage < productResultPages.length - 1) {
      const nextPage = currentProductResultsPage + 1;
      setCurrentProductResultsPage(nextPage);
      setProductResults(productResultPages[nextPage]);
      return;
    }

    if (!lastProductQuery || !productResultsNextAfter || isLoadingMoreProductResults) {
      return;
    }

    setIsLoadingMoreProductResults(true);
    setProductResultsError(null);

    try {
      const results = await fetchProductSearchResults(lastProductQuery, productResultsNextAfter);
      setProductResultPages((current) => [...current, results.products]);
      setCurrentProductResultsPage((current) => current + 1);
      setProductResults(results.products);
      setProductResultsNextAfter(results.meta?.nextAfter ?? null);
    } catch (error) {
      console.error('Error loading more product results:', error);
      setProductResultsError('Unable to load more products right now.');
    } finally {
      setIsLoadingMoreProductResults(false);
    }
  }, [
    currentProductResultsPage,
    isLoadingMoreProductResults,
    lastProductQuery,
    productResultPages,
    productResultsNextAfter,
  ]);

  const handlePreviousProductResultsPage = useCallback(() => {
    if (currentProductResultsPage === 0) {
      return;
    }

    const previousPage = currentProductResultsPage - 1;
    setCurrentProductResultsPage(previousPage);
    setProductResults(productResultPages[previousPage]);
  }, [currentProductResultsPage, productResultPages]);

  const handlePreviousDiscoveryPage = useCallback(() => {
    if (currentDiscoveryPage === 0) {
      return;
    }

    const previousPage = currentDiscoveryPage - 1;
    setCurrentDiscoveryPage(previousPage);
  }, [currentDiscoveryPage]);

  const filteredProducts = useMemo(() => {
    if (!catalogQuery.trim()) return products;
    const needle = catalogQuery.trim().toLowerCase();
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(needle) ||
        product.description.toLowerCase().includes(needle) ||
        (product.brand ? product.brand.toLowerCase().includes(needle) : false)
      );
    });
  }, [catalogQuery, products]);

  const renderPager = (options: {
    currentPage: number;
    onPrevious: () => void;
    onNext: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
    isLoadingNext?: boolean;
  }) => (
    <div className="mt-8 flex items-center justify-center gap-2 sm:gap-4">
      <button
        type="button"
        onClick={options.onPrevious}
        disabled={!options.hasPrevious}
        className="button-ghost inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        {'<'}
      </button>
      <div className="surface-muted rounded-full px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm">
        Page {options.currentPage}
      </div>
      <button
        type="button"
        onClick={options.onNext}
        disabled={!options.hasNext || options.isLoadingNext}
        className="button-ghost inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        {options.isLoadingNext ? <Spinner /> : '>'}
      </button>
    </div>
  );

  const renderSellerContent = () => {
    if (isSearchingProducts) {
      return (
        <div className="mt-20 flex justify-center">
          <Spinner />
        </div>
      );
    }
    if (productSearchError) {
      return (
        <>
          <p className="mt-8 text-center text-red-400">{productSearchError}</p>
          <SearchGuide />
        </>
      );
    }
    if (products.length > 0) {
      return (
        <>
          <div className="surface-card mb-6 rounded-[28px] p-5 sm:p-6">
            <label htmlFor="catalog-filter" className="mb-2 block text-sm font-medium text-muted">
              Filter results
            </label>
            <input
              id="catalog-filter"
              type="text"
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="Search within this seller's catalogue..."
              className="input-shell w-full rounded-2xl px-4 py-3"
            />
            <p className="mt-2 text-xs text-muted">
              Showing {filteredProducts.length} of {products.length} items.
            </p>
          </div>
          {filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <p className="mt-10 text-center text-muted">
              No products match &quot;{catalogQuery}&quot;. Try another keyword.
            </p>
          )}
        </>
      );
    }
    if (hasSearchedSeller) {
      return <SearchGuide />;
    }
    return (
      <div className="surface-card mt-12 rounded-[28px] p-6 text-center sm:rounded-[32px] sm:p-8">
        <h2 className="text-2xl font-bold">Welcome!</h2>
        <p className="mt-2 text-muted">Enter a Takealot Seller ID to list their catalogue.</p>
      </div>
    );
  };

  const renderProductContent = () => {
    const activeGroupMeta = featuredGroups.find(({ group }) => group === selectedFeaturedGroup);

    if (isSearchingProductResults) {
      return (
        <div className="mt-20 flex justify-center">
          <Spinner />
        </div>
      );
    }
    if (productResultsError) {
      return (
        <div className="mt-8 text-center text-red-400">
          {productResultsError}
          <p className="mt-2 text-sm text-gray-400">
            Use a more specific Takealot listing title or paste the full product URL.
          </p>
        </div>
      );
    }
    if (productResults.length > 0) {
      return (
        <div className="space-y-8">
          <section className="surface-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-7">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Matching products</h2>
                <p className="mt-1 text-sm text-muted">
                  Found {productResults.length} result{productResults.length === 1 ? '' : 's'} for{' '}
                  "{lastProductQuery}". Choose a listing to open its sourcing analysis, including
                  buybox position, delivery speed, seller strength, ratings, and comparison links.
                </p>
              </div>
              {selectedProductId && (
                <p className="break-all text-xs text-accent">Ready to analyse: {selectedProductId}</p>
              )}
            </div>
            <ProductGrid
              products={productResults}
              onInspectProduct={handleInspectProduct}
              inspectLabel="Open analysis"
              selectedProductId={selectedProductId}
            />
            {(productResultPages.length > 1 || productResultsNextAfter) &&
              renderPager({
                currentPage: currentProductResultsPage + 1,
                onPrevious: handlePreviousProductResultsPage,
                onNext: handleNextProductResultsPage,
                hasPrevious: currentProductResultsPage > 0,
                hasNext:
                  currentProductResultsPage < productResultPages.length - 1 ||
                  Boolean(productResultsNextAfter),
                isLoadingNext: isLoadingMoreProductResults,
              })}
          </section>
        </div>
      );
    }

    const discoveryProducts = discoveryPages[currentDiscoveryPage] ?? [];
    if (discoveryProducts.length > 0) {
      const activeFeaturedList = FEATURED_LISTS.find((item) => item.listingUrl === selectedFeaturedList);
      return (
        <div className="space-y-8">
          <section className="surface-card rounded-[28px] p-5 sm:p-7">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Browse source list</h2>
                <p className="mt-1 text-sm text-muted">
                  {activeFeaturedList
                    ? `Browsing ${activeFeaturedList.label}. Open any product to inspect its sourcing analysis.`
                    : 'This shortlist surfaces 20 products with comparatively stronger public signals across rating, review depth, seller strength, and buybox structure. Open any product to inspect its full sourcing analysis.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <p className="text-xs text-accent">Page {currentDiscoveryPage + 1}</p>
                <button
                  type="button"
                  onClick={handleClearFeaturedList}
                  className="button-ghost inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                >
                  Back to front page
                </button>
              </div>
            </div>
            <ProductGrid
              products={discoveryProducts}
              onInspectProduct={handleInspectProduct}
              inspectLabel="Open analysis"
              selectedProductId={selectedProductId}
            />
            {(discoveryPages.length > 1 || hasMoreDiscoveryProducts) &&
              renderPager({
                currentPage: currentDiscoveryPage + 1,
                onPrevious: handlePreviousDiscoveryPage,
                onNext: handleLoadDiscoveryProducts,
                hasPrevious: currentDiscoveryPage > 0,
                hasNext: currentDiscoveryPage < discoveryPages.length - 1 || hasMoreDiscoveryProducts,
                isLoadingNext: isLoadingProductDiscovery,
              })}
          </section>
        </div>
      );
    }

    if (hasSearchedOffers) {
      return (
        <div className="mx-auto mt-12 max-w-xl text-center text-gray-300">
          <h2 className="text-xl font-semibold">No products were found.</h2>
          <p className="mt-2 text-sm text-gray-400">
            Try another description or a more specific product title to surface a list of matching
            Takealot products.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <section className="surface-card max-w-full overflow-hidden rounded-[24px] p-4 sm:rounded-[32px] sm:p-8">
          <div className="app-grid">
            <div className="min-w-0 space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Product analysis</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
                  Analyse products before you commit capital.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
                  Search directly for a product, or browse curated Takealot source feeds by department.
                  Open any listing to inspect buybox signals, seller strength, rating depth, variation-level
                  performance, and external sourcing comparisons.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="surface-muted rounded-2xl p-4">
                  <p className="text-sm font-medium text-muted">Departments</p>
                  <p className="mt-2 text-3xl font-semibold">{featuredGroups.length}</p>
                </div>
                <div className="surface-muted rounded-2xl p-4">
                  <p className="text-sm font-medium text-muted">Source feeds</p>
                  <p className="mt-2 text-3xl font-semibold">{FEATURED_LISTS.length}</p>
                </div>
                <div className="surface-muted rounded-2xl p-4">
                  <p className="text-sm font-medium text-muted">Workflow</p>
                  <p className="mt-2 text-lg font-semibold">Search, browse, analyse</p>
                </div>
              </div>

              <div className="surface-muted rounded-2xl p-5">
                <h3 className="text-lg font-semibold">How to use product analysis</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold">1. Search directly</p>
                    <p className="mt-1 text-sm text-muted">Use a product title or Takealot URL when you already know the listing.</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">2. Browse by department</p>
                    <p className="mt-1 text-sm text-muted">Use the source explorer to jump into a curated feed without leaving the app.</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">3. Inspect the modal</p>
                    <p className="mt-1 text-sm text-muted">Review buybox, delivery, seller quality, product signals, and all available variations.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-muted min-w-0 rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Source explorer</p>
                  <h3 className="mt-2 text-xl font-semibold sm:text-2xl">Browse curated category feeds</h3>
                </div>
                <div className="metric-pill w-fit rounded-full px-3 py-1 text-xs font-semibold">
                  {activeGroupMeta?.count ?? 0} feeds
                </div>
              </div>

              <div className="mt-5 max-w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-2">
                {featuredGroups.map((item) => (
                  <button
                    key={item.group}
                    type="button"
                    onClick={() => setSelectedFeaturedGroup(item.group)}
                    className={`source-chip whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold sm:text-sm ${
                      item.group === selectedFeaturedGroup ? 'source-chip-active' : ''
                    }`}
                  >
                    {item.group}
                    <span className="ml-2 text-xs opacity-70">{item.count}</span>
                  </button>
                ))}
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="featured-filter" className="mb-2 block text-sm font-medium text-muted">
                  Filter source feeds
                </label>
                <input
                  id="featured-filter"
                  type="text"
                  value={featuredListQuery}
                  onChange={(event) => setFeaturedListQuery(event.target.value)}
                  placeholder="Filter this department..."
                  className="input-shell w-full rounded-2xl px-4 py-3"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-accent bg-[var(--accent-soft)] px-4 py-3">
                <p className="text-sm font-semibold">{selectedFeaturedGroup}</p>
                <p className="mt-1 text-sm text-muted">{activeGroupMeta?.description}</p>
              </div>

              <div className="mt-5 grid gap-3 max-h-[22rem] overflow-y-auto pr-1 sm:max-h-[28rem]">
                {featuredGroupItems.map((item) => (
                  <button
                    key={item.listingUrl}
                    type="button"
                    onClick={() => void handleSelectFeaturedList(item.listingUrl)}
                    disabled={isLoadingProductDiscovery && selectedFeaturedList === item.listingUrl}
                    className={`surface-soft rounded-2xl px-4 py-4 text-left transition-all hover:-translate-y-0.5 ${
                      selectedFeaturedList === item.listingUrl ? 'border-accent' : ''
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 hidden break-all text-xs text-muted sm:block">{item.listingUrl}</p>
                  </button>
                ))}
                {featuredGroupItems.length === 0 && (
                  <div className="surface-soft rounded-2xl px-4 py-6 text-sm text-muted">
                    No source feeds match that filter inside {selectedFeaturedGroup}.
                  </div>
                )}
              </div>
            </div>
          </div>

          {productDiscoveryError && (
            <p className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              {productDiscoveryError}
            </p>
          )}
        </section>
      </div>
    );
  };

  const renderContent = () => {
    if (searchMode === 'product') {
      return renderProductContent();
    }
    return renderSellerContent();
  };

  return (
      <div className="min-h-screen overflow-x-hidden font-sans">
      <header className="sticky top-0 z-10 border-b border-subtle bg-[color:var(--bg-elevated)]/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
            <img
              src="/6671601.png"
              alt="Takealot Seller Product Finder"
              className="h-12 w-12 rounded-2xl border border-accent object-cover sm:h-14 sm:w-14"
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-accent sm:text-3xl">
                Takealot Seller Product Finder
              </h1>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Search Takealot directly by seller ID or describe a product to surface the best offers.
              </p>
            </div>
          </div>
            <button
              type="button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="segmented-shell inline-flex w-fit self-start items-center justify-center rounded-full p-1 sm:self-auto"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  theme === 'light' ? 'segmented-option-active text-accent' : 'segmented-option'
                }`}
              >
                <SunIcon />
              </span>
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  theme === 'dark' ? 'segmented-option-active text-accent' : 'segmented-option'
                }`}
              >
                <MoonIcon />
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SearchForm
            mode={searchMode}
            onModeChange={setSearchMode}
            onSellerSearch={handleSellerSearch}
            onProductSearch={handleProductSearch}
            isLoading={isSearchingProducts || isSearchingProductResults || isLoadingSelectedProduct}
          />
        </div>
        <div className="mt-8">{renderContent()}</div>
      </main>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close product breakdown"
            onClick={() => setIsProductModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="absolute inset-0 overflow-y-auto p-0 sm:p-6 lg:p-10">
            <div className="mx-auto max-w-6xl">
              <div className="surface-card min-h-screen rounded-none sm:min-h-0 sm:rounded-[32px]">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-subtle bg-[color:var(--bg-elevated)]/95 px-4 py-4 backdrop-blur sm:px-5">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-faint">Product Analysis</p>
                    <h2 className="break-words text-base font-semibold sm:text-lg">
                      {productOffers?.product.name ?? (selectedProductId ? `Selected: ${selectedProductId}` : 'Loading')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="button-ghost inline-flex items-center justify-center rounded-full p-2 transition-colors"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4 pb-8 sm:p-6">
                  {isLoadingSelectedProduct && (
                    <div className="surface-muted rounded-[24px] p-5 sm:p-8">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Spinner />
                        <div>
                          <p className="font-semibold">Loading product analysis</p>
                          <p className="mt-1 text-sm text-muted">
                            Pulling buybox, delivery, seller, product-quality, and sourcing signals for the selected listing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {productOfferError && !isLoadingSelectedProduct && (
                    <div className="py-10 text-center text-red-400">
                      {productOfferError}
                    </div>
                  )}

                  {productOffers && productOffers.offers.length > 0 && !isLoadingSelectedProduct && (
                    <ProductOfferHighlights
                      summary={productOffers}
                      onSelectVariant={(productUrl) => void handleInspectVariant(productUrl)}
                      isLoadingVariant={isLoadingSelectedProduct}
                    />
                  )}

                  {productOffers && productOffers.offers.length === 0 && !isLoadingSelectedProduct && (
                    <div className="mx-auto max-w-xl py-10 text-center">
                      <h2 className="text-xl font-semibold">No highlighted offers were found.</h2>
                      <p className="mt-2 text-sm text-muted">
                        This product resolved correctly, but Takealot did not expose Best Price or Fastest
                        Delivery cards for it.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
