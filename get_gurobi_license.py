#!/usr/bin/env python3
"""
Script to retrieve Gurobi license using your license key
"""

import urllib.request
import urllib.parse
import socket
import uuid
import os
import sys

def get_host_id():
    """Get the host ID for this machine"""
    # Get MAC address as host ID
    mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff)
                    for elements in range(0,2*6,2)][::-1])
    return mac.upper()

def get_hostname():
    """Get hostname"""
    return socket.gethostname()

def retrieve_license(license_key):
    """Retrieve license from Gurobi servers"""
    
    host_id = get_host_id()
    hostname = get_hostname()
    
    print(f"Host ID: {host_id}")
    print(f"Hostname: {hostname}")
    print(f"License Key: {license_key}")
    
    # Prepare the request data
    data = {
        'uuid': license_key,
        'hostid': host_id,
        'hostname': hostname,
        'platform': 'mac64',
        'version': '12.0.2'
    }
    
    # URL encode the data
    encoded_data = urllib.parse.urlencode(data).encode('utf-8')
    
    # Make the request
    url = "https://license.gurobi.com/manager/licenses/download"
    
    try:
        req = urllib.request.Request(url, data=encoded_data, method='POST')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        req.add_header('User-Agent', 'grbgetkey/12.0.2')
        
        with urllib.request.urlopen(req) as response:
            license_content = response.read().decode('utf-8')
            
            # Check if this looks like a valid license
            if license_content.startswith('# Gurobi license') or 'HOSTID' in license_content:
                # Save to home directory
                license_path = os.path.join(os.path.expanduser('~'), 'gurobi.lic')
                with open(license_path, 'w') as f:
                    f.write(license_content)
                print(f"\nLicense successfully saved to: {license_path}")
                print("\nLicense preview:")
                print(license_content[:300] + "..." if len(license_content) > 300 else license_content)
                return True
            else:
                print(f"\nError: Response doesn't look like a valid license:")
                print(license_content[:500])
                return False
                
    except Exception as e:
        print(f"\nError retrieving license: {e}")
        return False

if __name__ == "__main__":
    license_key = "8e63884d-d7af-43c8-817c-e27bfd35760f"
    print("Retrieving Gurobi license...")
    
    success = retrieve_license(license_key)
    
    if success:
        print("\n✅ License retrieved successfully!")
        print("You can now try running your Gurobi optimization again.")
    else:
        print("\n❌ Failed to retrieve license.")
        print("You may need to manually download it from:")
        print("https://license.gurobi.com/manager/licenses")
