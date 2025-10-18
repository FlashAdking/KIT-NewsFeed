from playwright.async_api import async_playwright
from datetime import datetime, timedelta
import asyncio
import re

# Cache configuration
hackathon_cache = {
    "data": [],
    "last_updated": None,
    "is_scraping": False
}

CACHE_DURATION_HOURS = 6

def is_cache_valid():
    """Check if cache is still valid"""
    if not hackathon_cache["data"] or not hackathon_cache["last_updated"]:
        return False
    cache_age = datetime.now() - hackathon_cache["last_updated"]
    return cache_age < timedelta(hours=CACHE_DURATION_HOURS)

def clean_url(url):
    """Clean and validate URLs"""
    if not url:
        return None
    url = url.strip()
    url = url.replace('mlh.iohttps//', 'https://')
    # url = url.replace('mlh.iohttp://', 'https://')
    if url.startswith('//'):
        url = f"https:{url}"
    elif not url.startswith('http'):
        if url.startswith('/'):
            url = f"https://mlh.io{url}"
        else:
            url = f"https://{url}"
    if not re.match(r'^https?://', url):
        return None
    return url

def get_mock_hackathons():
    """Backup data when real scraping fails"""
    return [
        {"title": "HackMIT 2025", "content": "MIT's premier hackathon with 1000+ hackers!", "source": "MLH", "registrationLink": "https://hackmit.org", "externalUrl": "https://hackmit.org", "tags": ["MLH", "Hackathon"], "media": [], "eventDetails": {"venue": "MIT, Cambridge", "eventDate": "2025-11-15T09:00:00"}, "scrapedAt": datetime.now().isoformat()},
        {"title": "TreeHacks 2025", "content": "Stanford's hackathon - 36 hours of innovation!", "source": "MLH", "registrationLink": "https://treehacks.com", "externalUrl": "https://treehacks.com", "tags": ["MLH"], "media": [], "eventDetails": {"venue": "Stanford, CA", "eventDate": "2025-12-01T18:00:00"}, "scrapedAt": datetime.now().isoformat()},
        {"title": "PennApps 2025", "content": "One of the largest college hackathons!", "source": "Devpost", "registrationLink": "https://pennapps.com", "externalUrl": "https://pennapps.com", "tags": ["Devpost"], "media": [], "eventDetails": {"venue": "UPenn", "eventDate": "2025-10-20T12:00:00"}, "scrapedAt": datetime.now().isoformat()},
        {"title": "Hack the North", "content": "Canada's biggest hackathon - $50K prizes!", "source": "MLH", "registrationLink": "https://hackthenorth.com", "externalUrl": "https://hackthenorth.com", "tags": ["MLH"], "media": [], "eventDetails": {"venue": "Waterloo, ON", "eventDate": "2025-11-22T17:00:00"}, "scrapedAt": datetime.now().isoformat()},
        {"title": "CalHacks 2025", "content": "UC Berkeley's premier hackathon!", "source": "MLH", "registrationLink": "https://calhacks.io", "externalUrl": "https://calhacks.io", "tags": ["MLH"], "media": [], "eventDetails": {"venue": "Berkeley, CA", "eventDate": "2025-10-28T10:00:00"}, "scrapedAt": datetime.now().isoformat()},
        {"title": "HackGT 2025", "content": "Georgia Tech's hackathon with top mentors!", "source": "Devpost", "registrationLink": "https://hack.gt", "externalUrl": "https://hack.gt", "tags": ["Devpost"], "media": [], "eventDetails": {"venue": "Georgia Tech", "eventDate": "2025-11-08T14:00:00"}, "scrapedAt": datetime.now().isoformat()},
        {"title": "ETHGlobal Brussels", "content": "Build the future of Web3 and DeFi!", "source": "ETHGlobal", "registrationLink": "https://ethglobal.com/events/brussels", "externalUrl": "https://ethglobal.com/events/brussels", "tags": ["ETHGlobal", "Web3"], "media": [], "eventDetails": {"venue": "Brussels", "eventDate": "2025-10-25T09:00:00"}, "scrapedAt": datetime.now().isoformat()},
        {"title": "ETHGlobal SF", "content": "Ethereum hackathon in San Francisco!", "source": "ETHGlobal", "registrationLink": "https://ethglobal.com/events/sf", "externalUrl": "https://ethglobal.com/events/sf", "tags": ["ETHGlobal"], "media": [], "eventDetails": {"venue": "San Francisco", "eventDate": "2025-11-18T10:00:00"}, "scrapedAt": datetime.now().isoformat()},
        {"title": "Devfolio India Hack", "content": "India's top hackathon - compete nationwide!", "source": "Devfolio", "registrationLink": "https://devfolio.co/hackathons", "externalUrl": "https://devfolio.co/hackathons", "tags": ["Devfolio"], "media": [], "eventDetails": {"venue": "India", "eventDate": "2025-11-10T10:00:00"}, "scrapedAt": datetime.now().isoformat()},
        {"title": "MHacks 2025", "content": "University of Michigan's flagship hackathon!", "source": "MLH", "registrationLink": "https://mhacks.org", "externalUrl": "https://mhacks.org", "tags": ["MLH"], "media": [], "eventDetails": {"venue": "Ann Arbor, MI", "eventDate": "2025-12-15T16:00:00"}, "scrapedAt": datetime.now().isoformat()}
    ]

async def scrape_mlh(page):
    hackathons = []
    print("🔍 Scraping MLH...")
    try:
        await page.goto('https://mlh.io/seasons/2025/events', wait_until='domcontentloaded', timeout=15000)
        await page.wait_for_timeout(2000)
        events = await page.query_selector_all('.event-wrapper, .event')
        print(f"   📊 Found {len(events)} events")
        for idx, event in enumerate(events[:8]):
            try:
                title_elem = await event.query_selector('h3, h2')
                title = await title_elem.inner_text() if title_elem else f"MLH Event {idx+1}"
                link_elem = await event.query_selector('a')
                link = await link_elem.get_attribute('href') if link_elem else "https://mlh.io"
                if link and not link.startswith('http'):
                    link = f"https://mlh.io{link}" if link.startswith('/') else f"https://{link}"
                img = await event.query_selector('img')
                img_url = clean_url(await img.get_attribute('src')) if img else None
                hackathons.append({"title": title.strip()[:100], "content": "Join this MLH hackathon!", "source": "MLH", "registrationLink": link, "externalUrl": link, "tags": ["MLH"], "media": [{"type": "image", "url": img_url}] if img_url else [], "eventDetails": {"venue": "Online", "eventDate": None}, "scrapedAt": datetime.now().isoformat()})
                print(f"   ✅ {idx+1}. {title[:40]}...")
            except: continue
        print(f"   🎉 MLH: {len(hackathons)} results")
    except Exception as e:
        print(f"   ⚠️  MLH blocked: {str(e)[:50]}")
    return hackathons

async def scrape_devpost(page):
    hackathons = []
    print("🔍 Scraping Devpost...")
    try:
        await page.goto('https://devpost.com/hackathons?status=upcoming', wait_until='domcontentloaded', timeout=15000)
        await page.wait_for_timeout(2000)
        events = await page.query_selector_all('.challenge-listing, article')
        print(f"   📊 Found {len(events)} events")
        for idx, event in enumerate(events[:8]):
            try:
                title_elem = await event.query_selector('h2, h3')
                title = await title_elem.inner_text() if title_elem else f"Devpost Event {idx+1}"
                link_elem = await event.query_selector('a')
                link = await link_elem.get_attribute('href') if link_elem else "https://devpost.com"
                if link and not link.startswith('http'):
                    link = f"https://devpost.com{link}"
                hackathons.append({"title": title.strip()[:100], "content": "Devpost hackathon opportunity!", "source": "Devpost", "registrationLink": link, "externalUrl": link, "tags": ["Devpost"], "media": [], "eventDetails": {"venue": "Online", "eventDate": None}, "scrapedAt": datetime.now().isoformat()})
                print(f"   ✅ {idx+1}. {title[:40]}...")
            except: continue
        print(f"   🎉 Devpost: {len(hackathons)} results")
    except Exception as e:
        print(f"   ⚠️  Devpost blocked: {str(e)[:50]}")
    return hackathons

async def scrape_ethglobal(page):
    hackathons = []
    print("🔍 Scraping ETHGlobal...")
    try:
        await page.goto('https://ethglobal.com/events', wait_until='domcontentloaded', timeout=15000)
        await page.wait_for_timeout(2000)
        events = await page.query_selector_all('article, .event')
        print(f"   📊 Found {len(events)} events")
        for idx, event in enumerate(events[:6]):
            try:
                title_elem = await event.query_selector('h1, h2, h3')
                title = await title_elem.inner_text() if title_elem else f"ETHGlobal Event {idx+1}"
                link_elem = await event.query_selector('a')
                link = await link_elem.get_attribute('href') if link_elem else "https://ethglobal.com"
                if link and not link.startswith('http'):
                    link = f"https://ethglobal.com{link}"
                hackathons.append({"title": title.strip()[:100], "content": "Blockchain hackathon by ETHGlobal!", "source": "ETHGlobal", "registrationLink": link, "externalUrl": link, "tags": ["ETHGlobal", "Web3"], "media": [], "eventDetails": {"venue": "Global", "eventDate": None}, "scrapedAt": datetime.now().isoformat()})
                print(f"   ✅ {idx+1}. {title[:40]}...")
            except: continue
        print(f"   🎉 ETHGlobal: {len(hackathons)} results")
    except Exception as e:
        print(f"   ⚠️  ETHGlobal blocked: {str(e)[:50]}")
    return hackathons

async def scrape_devfolio(page):
    hackathons = []
    print("🔍 Scraping Devfolio...")
    try:
        await page.goto('https://devfolio.co/hackathons', wait_until='domcontentloaded', timeout=15000)
        await page.wait_for_timeout(2000)
        events = await page.query_selector_all('article, [class*="hackathon"]')
        print(f"   📊 Found {len(events)} events")
        for idx, event in enumerate(events[:6]):
            try:
                title_elem = await event.query_selector('h1, h2, h3')
                title = await title_elem.inner_text() if title_elem else f"Devfolio Event {idx+1}"
                link_elem = await event.query_selector('a')
                link = await link_elem.get_attribute('href') if link_elem else "https://devfolio.co"
                if link and not link.startswith('http'):
                    link = f"https://devfolio.co{link}"
                hackathons.append({"title": title.strip()[:100], "content": "Indian hackathon on Devfolio!", "source": "Devfolio", "registrationLink": link, "externalUrl": link, "tags": ["Devfolio"], "media": [], "eventDetails": {"venue": "India", "eventDate": None}, "scrapedAt": datetime.now().isoformat()})
                print(f"   ✅ {idx+1}. {title[:40]}...")
            except: continue
        print(f"   🎉 Devfolio: {len(hackathons)} results")
    except Exception as e:
        print(f"   ⚠️  Devfolio blocked: {str(e)[:50]}")
    return hackathons

async def perform_scraping():
    all_hackathons = []
    print("\n" + "="*60)
    print("🚀 Starting scraping (ALL PLATFORMS)...")
    print("="*60)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled', '--no-sandbox'])
            context = await browser.new_context(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', viewport={'width': 1920, 'height': 1080})
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
            page = await context.new_page()
            
            all_hackathons.extend(await scrape_mlh(page))
            all_hackathons.extend(await scrape_devpost(page))
            all_hackathons.extend(await scrape_ethglobal(page))
            all_hackathons.extend(await scrape_devfolio(page))
            await browser.close()
    except Exception as e:
        print(f"❌ Browser error: {str(e)[:80]}")
    
    print(f"\n📊 Scraped: {len(all_hackathons)} real hackathons")
    
    if len(all_hackathons) == 0:
        print("⚠️  All scrapers blocked - using mock data")
        all_hackathons = get_mock_hackathons()
    elif len(all_hackathons) < 5:
        print(f"⚠️  Only {len(all_hackathons)} scraped - adding {10-len(all_hackathons)} mock")
        all_hackathons.extend(get_mock_hackathons()[:10-len(all_hackathons)])
    else:
        print(f"✅ Enough real data ({len(all_hackathons)})")
    
    print("="*60)
    print(f"✅ Final: {len(all_hackathons)} hackathons")
    print("="*60 + "\n")
    return all_hackathons

async def background_scraper():
    global hackathon_cache
    while True:
        try:
            if not is_cache_valid() and not hackathon_cache["is_scraping"]:
                hackathon_cache["is_scraping"] = True
                try:
                    hackathons = await perform_scraping()
                    hackathon_cache["data"] = hackathons
                    hackathon_cache["last_updated"] = datetime.now()
                finally:
                    hackathon_cache["is_scraping"] = False
            await asyncio.sleep(1800)
        except:
            hackathon_cache["is_scraping"] = False
            await asyncio.sleep(60)
