# Install required packages:
# pip install playwright fastapi uvicorn
# python -m playwright install

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from datetime import datetime, timedelta
import re

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Hackathon(BaseModel):
    id: int
    title: str
    description: str
    date: str
    location: str
    prize: Optional[str]
    source: str
    url: str
    tags: List[str]

# Global cache for hackathons
hackathon_cache = {
    "data": [],
    "last_updated": None,
    "is_scraping": False
}

# Configuration
CACHE_DURATION_HOURS = 6  # Refresh every 6 hours
INITIAL_SCRAPE_DONE = False

# Scraper functions for different websites
async def scrape_devpost(page):
    hackathons = []
    print("🔍 Scraping Devpost...")
    try:
        await page.goto('https://devpost.com/hackathons', timeout=30000, wait_until='domcontentloaded')
        await page.wait_for_timeout(2000)
        
        # Try to find hackathon cards
        tiles = await page.query_selector_all('.hackathon-tile')
        print(f"   Found {len(tiles)} Devpost hackathons")
        
        for idx, tile in enumerate(tiles[:8]):
            try:
                title_elem = await tile.query_selector('h3, h2, .title')
                title = await title_elem.inner_text() if title_elem else None
                
                if not title:
                    continue
                
                desc_elem = await tile.query_selector('p, .description')
                description = await desc_elem.inner_text() if desc_elem else "Exciting hackathon opportunity"
                
                link_elem = await tile.query_selector('a')
                url = await link_elem.get_attribute('href') if link_elem else ""
                if url and not url.startswith('http'):
                    url = f"https://devpost.com{url}"
                
                hackathons.append({
                    'id': idx + 1,
                    'title': title.strip(),
                    'description': description.strip()[:150],
                    'date': '2025',
                    'location': 'Virtual/Hybrid',
                    'prize': 'Prizes Available',
                    'source': 'Devpost',
                    'url': url or 'https://devpost.com/hackathons',
                    'tags': ['General', 'Open', 'Tech']
                })
            except Exception as e:
                print(f"   ⚠️  Error parsing Devpost tile {idx}: {e}")
                continue
                
    except Exception as e:
        print(f"   ❌ Error scraping Devpost: {e}")
    
    print(f"   ✅ Scraped {len(hackathons)} hackathons from Devpost")
    return hackathons

async def scrape_mlh(page):
    hackathons = []
    print("🔍 Scraping MLH...")
    try:
        await page.goto('https://mlh.io/seasons/2025/events', timeout=30000, wait_until='domcontentloaded')
        await page.wait_for_timeout(2000)
        
        events = await page.query_selector_all('.event, [class*="event"]')
        print(f"   Found {len(events)} MLH events")
        
        for idx, event in enumerate(events[:8]):
            try:
                text = await event.inner_text()
                lines = [l.strip() for l in text.split('\n') if l.strip()]
                
                if not lines or len(lines[0]) < 3:
                    continue
                
                title = lines[0]
                location = lines[1] if len(lines) > 1 else "Virtual"
                date = lines[2] if len(lines) > 2 else "2025"
                
                link = await event.query_selector('a')
                url = await link.get_attribute('href') if link else ""
                if url and not url.startswith('http'):
                    url = f"https://mlh.io{url}"
                
                hackathons.append({
                    'id': idx + 100,
                    'title': title,
                    'description': 'Official MLH Member Event with mentorship and prizes',
                    'date': date,
                    'location': location,
                    'prize': 'MLH Prize Pool',
                    'source': 'MLH',
                    'url': url or 'https://mlh.io/seasons/2025/events',
                    'tags': ['MLH', 'Student', 'Verified']
                })
            except Exception as e:
                print(f"   ⚠️  Error parsing MLH event {idx}: {e}")
                continue
                
    except Exception as e:
        print(f"   ❌ Error scraping MLH: {e}")
    
    print(f"   ✅ Scraped {len(hackathons)} hackathons from MLH")
    return hackathons

async def scrape_ethglobal(page):
    hackathons = []
    print("🔍 Scraping ETHGlobal...")
    try:
        await page.goto('https://ethglobal.com/events', timeout=30000, wait_until='domcontentloaded')
        await page.wait_for_timeout(3000)
        
        # Get all event links
        events = await page.query_selector_all('a[href*="/events/"]')
        print(f"   Found {len(events)} ETHGlobal links")
        
        seen_titles = set()
        for idx, event in enumerate(events):
            try:
                text = await event.inner_text()
                text = text.strip()
                
                if not text or len(text) < 5 or text in seen_titles:
                    continue
                
                # Filter out navigation items
                if text.lower() in ['events', 'home', 'about', 'showcase']:
                    continue
                    
                seen_titles.add(text)
                
                url = await event.get_attribute('href')
                if url and not url.startswith('http'):
                    url = f"https://ethglobal.com{url}"
                
                hackathons.append({
                    'id': idx + 200,
                    'title': text,
                    'description': 'Build cutting-edge Web3 applications on Ethereum',
                    'date': '2025',
                    'location': 'Global',
                    'prize': '$100,000+ Pool',
                    'source': 'ETHGlobal',
                    'url': url or 'https://ethglobal.com/events',
                    'tags': ['Blockchain', 'Ethereum', 'Web3', 'DeFi']
                })
                
                if len(hackathons) >= 8:
                    break
                    
            except Exception as e:
                continue
                
    except Exception as e:
        print(f"   ❌ Error scraping ETHGlobal: {e}")
    
    print(f"   ✅ Scraped {len(hackathons)} hackathons from ETHGlobal")
    return hackathons

async def scrape_devfolio(page):
    hackathons = []
    print("🔍 Scraping Devfolio...")
    try:
        await page.goto('https://devfolio.co/hackathons/live', timeout=30000, wait_until='domcontentloaded')
        await page.wait_for_timeout(3000)
        
        cards = await page.query_selector_all('a[href*="/hackathons/"]')
        print(f"   Found {len(cards)} Devfolio cards")
        
        seen_titles = set()
        for idx, card in enumerate(cards):
            try:
                text = await card.inner_text()
                lines = [l.strip() for l in text.split('\n') if l.strip()]
                
                if not lines or len(lines[0]) < 3:
                    continue
                
                title = lines[0]
                if title in seen_titles:
                    continue
                seen_titles.add(title)
                
                url = await card.get_attribute('href')
                if url and not url.startswith('http'):
                    url = f"https://devfolio.co{url}"
                
                hackathons.append({
                    'id': idx + 300,
                    'title': title,
                    'description': 'Innovation-focused hackathon from India',
                    'date': '2025',
                    'location': 'India/Virtual',
                    'prize': 'Cash Prizes',
                    'source': 'Devfolio',
                    'url': url or 'https://devfolio.co/hackathons',
                    'tags': ['India', 'Innovation', 'Tech']
                })
                
                if len(hackathons) >= 8:
                    break
                    
            except Exception as e:
                continue
                
    except Exception as e:
        print(f"   ❌ Error scraping Devfolio: {e}")
    
    print(f"   ✅ Scraped {len(hackathons)} hackathons from Devfolio")
    return hackathons

async def perform_scraping():
    """Core scraping logic that updates the cache"""
    print("\n" + "="*50)
    print("🚀 Starting hackathon scraping...")
    print("="*50)
    
    all_hackathons = []
    
    async with async_playwright() as p:
        print("🌐 Launching browser...")
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080}
        )
        
        # Create pages for each scraper
        pages = []
        for _ in range(4):
            page = await context.new_page()
            pages.append(page)
        
        print("\n📡 Scraping from 4 sources concurrently...\n")
        
        # Run scrapers concurrently with timeout
        tasks = [
            scrape_devpost(pages[0]),
            scrape_mlh(pages[1]),
            scrape_ethglobal(pages[2]),
            scrape_devfolio(pages[3])
        ]
        
        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=45.0
            )
            
            # Collect results
            for result in results:
                if isinstance(result, list):
                    all_hackathons.extend(result)
                elif isinstance(result, Exception):
                    print(f"⚠️  Scraper exception: {result}")
                    
        except asyncio.TimeoutError:
            print("⏱️  Scraping timeout - returning partial results")
        
        await browser.close()
    
    # Remove duplicates
    unique_hackathons = []
    seen_titles = set()
    
    for h in all_hackathons:
        title_key = re.sub(r'[^a-z0-9]', '', h['title'].lower())
        if title_key not in seen_titles and len(title_key) > 3:
            seen_titles.add(title_key)
            unique_hackathons.append(h)
    
    print("\n" + "="*50)
    print(f"✅ Successfully scraped {len(unique_hackathons)} unique hackathons!")
    print("="*50 + "\n")
    
    return unique_hackathons[:40]

async def background_scraper():
    """Background task that continuously scrapes hackathons"""
    global INITIAL_SCRAPE_DONE
    
    while True:
        try:
            if hackathon_cache["is_scraping"]:
                print("⏳ Scraping already in progress, skipping...")
                await asyncio.sleep(60)
                continue
            
            hackathon_cache["is_scraping"] = True
            
            # Perform scraping
            hackathons = await perform_scraping()
            
            # Update cache
            hackathon_cache["data"] = hackathons
            hackathon_cache["last_updated"] = datetime.now()
            INITIAL_SCRAPE_DONE = True
            
            print(f"💾 Cache updated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"⏰ Next update in {CACHE_DURATION_HOURS} hours\n")
            
        except Exception as e:
            print(f"❌ Background scraping error: {e}")
        finally:
            hackathon_cache["is_scraping"] = False
        
        # Wait for configured duration before next scrape
        await asyncio.sleep(CACHE_DURATION_HOURS * 60 * 60)

def is_cache_valid():
    """Check if cache is still valid"""
    if not hackathon_cache["data"] or not hackathon_cache["last_updated"]:
        return False
    
    cache_age = datetime.now() - hackathon_cache["last_updated"]
    return cache_age < timedelta(hours=CACHE_DURATION_HOURS)

@app.on_event("startup")
async def startup_event():
    """Start background scraper when app starts"""
    print("\n" + "="*60)
    print("🎯 HACKATHON AGGREGATOR - AUTO-REFRESH MODE")
    print("="*60)
    print(f"⚙️  Cache refresh interval: {CACHE_DURATION_HOURS} hours")
    print(f"🔄 Background scraping: ENABLED")
    print("="*60 + "\n")
    
    # Start background task
    asyncio.create_task(background_scraper())

@app.get("/")
async def root():
    cache_status = "Valid" if is_cache_valid() else "Expired/Empty"
    last_update = hackathon_cache["last_updated"].strftime('%Y-%m-%d %H:%M:%S') if hackathon_cache["last_updated"] else "Never"
    
    return {
        "message": "Hackathon Aggregator API - Auto-Refresh Mode",
        "status": "running",
        "cache_status": cache_status,
        "last_updated": last_update,
        "cached_hackathons": len(hackathon_cache["data"]),
        "refresh_interval_hours": CACHE_DURATION_HOURS,
        "endpoints": {
            "/hackathons": "GET - Fetch all hackathons (cached)",
            "/health": "GET - Health check with cache info"
        }
    }

@app.get("/hackathons", response_model=List[Hackathon])
async def get_hackathons():
    """
    Returns cached hackathons. Cache is automatically refreshed every 6 hours.
    If cache is empty (first request), triggers immediate scraping.
    """
    
    # If cache is empty and no scraping in progress, do initial scrape
    if not hackathon_cache["data"] and not hackathon_cache["is_scraping"] and not INITIAL_SCRAPE_DONE:
        print("📭 Cache empty - performing initial scrape...")
        hackathon_cache["is_scraping"] = True
        try:
            hackathons = await perform_scraping()
            hackathon_cache["data"] = hackathons
            hackathon_cache["last_updated"] = datetime.now()
        finally:
            hackathon_cache["is_scraping"] = False
    
    # Return cached data
    if hackathon_cache["data"]:
        cache_age = datetime.now() - hackathon_cache["last_updated"] if hackathon_cache["last_updated"] else None
        age_str = f"{int(cache_age.total_seconds() / 60)} minutes" if cache_age else "unknown"
        print(f"✅ Returning {len(hackathon_cache['data'])} hackathons from cache (age: {age_str})")
        return hackathon_cache["data"]
    else:
        # Fallback if cache is still empty
        print("⚠️  Cache still empty, returning empty list")
        return []

@app.get("/health")
async def health():
    cache_age = None
    if hackathon_cache["last_updated"]:
        cache_age = (datetime.now() - hackathon_cache["last_updated"]).total_seconds() / 60
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cache": {
            "is_valid": is_cache_valid(),
            "last_updated": hackathon_cache["last_updated"].isoformat() if hackathon_cache["last_updated"] else None,
            "age_minutes": round(cache_age) if cache_age else None,
            "hackathon_count": len(hackathon_cache["data"]),
            "is_scraping": hackathon_cache["is_scraping"]
        },
        "config": {
            "refresh_interval_hours": CACHE_DURATION_HOURS
        }
    }

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting Hackathon Aggregator API with Auto-Refresh...")
    print("📍 API will be available at: http://localhost:8000")
    print("📍 Hackathons endpoint: http://localhost:8000/hackathons")
    print("📍 Health check: http://localhost:8000/health")
    print("📍 API docs: http://localhost:8000/docs\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)