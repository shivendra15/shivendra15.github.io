#!/usr/bin/env python3
"""
Fetch Google Scholar data and update publications.json
"""

import json
import os
from datetime import datetime

try:
    from scholarly import scholarly
except ImportError:
    print("Installing scholarly...")
    os.system("pip install scholarly")
    from scholarly import scholarly


AUTHOR_ID = "P2szTJwAAAAJ"
OUTPUT_FILE = "publications/publications.json"


def classify_publication(venue):
    """Classify publication as journal or conference."""
    venue_lower = (venue or "").lower()
    
    conference_keywords = [
        'conference', 'symposium', 'workshop', 'proceedings',
        'meeting', 'congress', 'drc', 'edtm', 'iedm', 'vlsi',
        'irps', 'nano', 'dac', 'upcon', 'mos-ak', 'vdat',
        'icmc', 'iscas', 'date', 'isvlsi'
    ]
    
    journal_keywords = [
        'transactions', 'journal', 'letters', 'ieee trans',
        'ieee electron', 'ieee open', 'npj'
    ]
    
    for kw in conference_keywords:
        if kw in venue_lower:
            return 'conference'
    
    for kw in journal_keywords:
        if kw in venue_lower:
            return 'journal'
    
    if 'ieee' in venue_lower and 'conf' not in venue_lower:
        return 'journal'
    
    return 'journal'


def fetch_scholar_data():
    """Fetch data from Google Scholar."""
    print(f"Fetching data for author ID: {AUTHOR_ID}")
    
    try:
        # Search by author ID
        author = scholarly.search_author_id(AUTHOR_ID)
        author = scholarly.fill(author, sections=['basics', 'indices', 'publications'])
        
        print(f"Found: {author.get('name', 'Unknown')}")
        print(f"Citations: {author.get('citedby', 0)}")
        
        # Extract stats
        citations = author.get('citedby', 0)
        h_index = author.get('hindex', 0)
        i10_index = author.get('i10index', 0)
        
        # Extract publications
        publications = []
        for pub in author.get('publications', []):
            # Fill publication details
            try:
                pub_filled = scholarly.fill(pub)
            except:
                pub_filled = pub
            
            bib = pub_filled.get('bib', {})
            
            title = bib.get('title', '')
            authors = bib.get('author', '')
            venue = bib.get('venue', '') or bib.get('journal', '') or bib.get('booktitle', '')
            year = str(bib.get('pub_year', ''))
            cited_by = pub_filled.get('num_citations', 0)
            
            # Get link
            pub_url = pub_filled.get('author_pub_id', '')
            if pub_url:
                link = f"https://scholar.google.com/citations?view_op=view_citation&hl=en&user={AUTHOR_ID}&citation_for_view={AUTHOR_ID}:{pub_url.split(':')[-1] if ':' in pub_url else pub_url}"
            else:
                link = ''
            
            pub_type = classify_publication(venue)
            
            publications.append({
                'title': title,
                'authors': authors,
                'venue': venue,
                'year': year,
                'citations': cited_by,
                'link': link,
                'type': pub_type
            })
        
        # Sort by year (newest first)
        publications.sort(key=lambda x: x.get('year', '0'), reverse=True)
        
        # Count types
        journals = len([p for p in publications if p['type'] == 'journal'])
        conferences = len([p for p in publications if p['type'] == 'conference'])
        
        # Build output
        output = {
            'lastUpdated': datetime.utcnow().isoformat() + 'Z',
            'authorId': AUTHOR_ID,
            'authorName': 'Shivendra Singh Parihar',
            'stats': {
                'citations': str(citations),
                'hIndex': str(h_index),
                'i10Index': str(i10_index),
                'totalPublications': len(publications),
                'journals': journals,
                'conferences': conferences
            },
            'publications': publications
        }
        
        return output
        
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None


def main():
    """Main function."""
    data = fetch_scholar_data()
    
    if data is None:
        print("Failed to fetch data. Keeping existing file.")
        return
    
    if len(data['publications']) == 0:
        print("No publications found. Keeping existing file.")
        return
    
    # Load existing data to compare
    existing_count = 0
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r') as f:
                existing = json.load(f)
                existing_count = len(existing.get('publications', []))
        except:
            pass
    
    new_count = len(data['publications'])
    print(f"Existing publications: {existing_count}")
    print(f"New publications found: {new_count}")
    
    # Safety check: don't overwrite if new data has significantly fewer publications
    if existing_count > 0 and new_count < existing_count * 0.7:
        print(f"WARNING: New data has significantly fewer publications ({new_count} vs {existing_count}). Skipping update.")
        return
    
    # Write output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully updated {OUTPUT_FILE}")
    print(f"  Publications: {new_count}")
    print(f"  Citations: {data['stats']['citations']}")
    print(f"  h-index: {data['stats']['hIndex']}")
    print(f"  i10-index: {data['stats']['i10Index']}")


if __name__ == '__main__':
    main()
