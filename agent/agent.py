import time
import json
import threading
import requests
import psutil
import pyperclip
import wmi
import socket
import os
import re
import win32gui
from datetime import datetime

class Agent:
    def __init__(self):
        with open('config.json', 'r') as f:
            self.config = json.load(f)
        
        self.api_url = self.config['api_url']
        self.token = self.config['api_token']
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        self.permissions = {
            "intProcess": False,
            "intUsb": False,
            "intNetwork": False,
            "intFiles": False,
            "intClipboard": False
        }
        
        self.events_queue = []
        self.running = True
        
        # State tracking
        self.last_clipboard = ""
        self.scanned_files_run = False

    def poll_config(self):
        while self.running:
            try:
                res = requests.get(f"{self.api_url}/api/agent/config", headers=self.headers, timeout=10)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("success"):
                        self.permissions = data.get("permissions", {})
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] Config synced. Permissions: {self.permissions}")
            except Exception as e:
                print("Failed to sync config:", e)
            
            time.sleep(30)

    def flush_events(self):
        while self.running:
            time.sleep(10)
            if self.events_queue:
                events_to_send = list(self.events_queue)
                self.events_queue.clear()
                try:
                    res = requests.post(
                        f"{self.api_url}/api/agent/telemetry", 
                        headers=self.headers, 
                        json={"events": events_to_send},
                        timeout=10
                    )
                    if res.status_code != 200:
                        # Put back if failed
                        self.events_queue.extend(events_to_send)
                except Exception as e:
                    self.events_queue.extend(events_to_send)

    def log_event(self, category, data):
        self.events_queue.append({
            "category": category,
            "data": data,
            "timestamp": datetime.now().isoformat()
        })
        print(f"Logged {category} event.")

    def monitor_clipboard(self):
        while self.running:
            if self.permissions.get("intClipboard"):
                try:
                    current = pyperclip.paste()
                    if current and current != self.last_clipboard:
                        self.last_clipboard = current
                        
                        # Check patterns
                        matched = "general"
                        if re.search(r'\b(?:\d[ -]*?){13,16}\b', current):
                            matched = "credit_card"
                        elif "api_key" in current.lower() or current.startswith("sk-"):
                            matched = "api_key"
                            
                        self.log_event("clipboard", {
                            "event": "copy",
                            "patternMatched": matched,
                            "preview": current[:50] + ("..." if len(current) > 50 else "")
                        })
                except Exception:
                    pass
            time.sleep(2)

    def monitor_processes(self):
        while self.running:
            if self.permissions.get("intProcess"):
                processes = []
                for p in psutil.process_iter(['name', 'pid', 'cpu_percent', 'memory_info']):
                    try:
                        info = p.info
                        processes.append({
                            "name": info['name'],
                            "pid": info['pid'],
                            "cpu": info['cpu_percent'],
                            "memory": info['memory_info'].rss / (1024 * 1024) if info['memory_info'] else 0
                        })
                    except Exception:
                        pass
                
                # Sort by memory usage
                processes.sort(key=lambda x: x['memory'], reverse=True)
                
                # Filter out massive system background services to find real apps
                system_procs = ['memcompression', 'vmmemwsl', 'svchost.exe', 'system', 'registry']
                real_apps = [p for p in processes if p['name'].lower() not in system_procs]
                top_10 = real_apps[:10]
                
                # Get active window
                active_window = "Unknown"
                try:
                    hwnd = win32gui.GetForegroundWindow()
                    active_window = win32gui.GetWindowText(hwnd)
                except Exception:
                    pass
                
                now_hour = datetime.now().hour
                is_after_hours = now_hour < 6 or now_hour > 19
                
                self.log_event("process", {
                    "processes": top_10,
                    "activeWindow": active_window,
                    "isAfterHours": is_after_hours,
                    "sessionHour": now_hour
                })
            time.sleep(10)

    def monitor_network(self):
        while self.running:
            if self.permissions.get("intNetwork"):
                try:
                    # Very basic check - get local IP
                    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                    s.connect(("8.8.8.8", 80))
                    local_ip = s.getsockname()[0]
                    s.close()
                    
                    self.log_event("network", {
                        "ip": local_ip,
                        "connectionType": "wifi",
                        "isVpnSuspected": local_ip.startswith("10.") or local_ip.startswith("172.")
                    })
                except Exception:
                    pass
            time.sleep(60)

    def monitor_usb(self):
        try:
            import pythoncom
            pythoncom.CoInitialize() # Required for background threads using WMI
            c = wmi.WMI()
            watcher = c.Win32_DeviceChangeEvent.watch_for(EventType=2) # 2 = connected
            while self.running:
                if self.permissions.get("intUsb"):
                    try:
                        event = watcher(timeout_ms=2000)
                        if event:
                            self.log_event("usb", {
                                "event": "connected",
                                "device": "Unknown USB Device (WMI Hook)",
                            })
                            # Windows fires 5-10 events for a single physical USB insertion (Hub, Drive, Volume, etc)
                            # Sleep for 10 seconds to debounce and prevent spamming the feed
                            time.sleep(10)
                    except wmi.x_wmi_timed_out:
                        pass
                    except Exception:
                        time.sleep(2)
                else:
                    time.sleep(5)
        except Exception as e:
            print("USB monitoring requires Windows WMI:", e)

    def scan_files(self):
        while self.running:
            if self.permissions.get("intFiles") and not self.scanned_files_run:
                try:
                    # Scan Documents folder
                    docs_path = os.path.expanduser("~/Documents")
                    flagged = []
                    scanned = 0
                    
                    patterns = ['password', 'credential', 'salary', 'confidential', 'secret']
                    
                    for root, dirs, files in os.walk(docs_path):
                        for file in files:
                            scanned += 1
                            lname = file.lower()
                            for pat in patterns:
                                if pat in lname:
                                    flagged.append({"name": file, "pattern": pat})
                                    break
                            if scanned > 1000: # Limit for demo
                                break
                        if scanned > 1000:
                            break
                            
                    self.log_event("files", {
                        "scannedFiles": scanned,
                        "flaggedNames": flagged,
                        "scanPath": docs_path
                    })
                    self.scanned_files_run = True
                except Exception as e:
                    print("File scan error:", e)
            
            if not self.permissions.get("intFiles"):
                self.scanned_files_run = False # Reset if turned off then on
                
            time.sleep(10)

    def start(self):
        print("Starting HRIP Telemetry Agent...")
        threads = [
            threading.Thread(target=self.poll_config, daemon=True),
            threading.Thread(target=self.flush_events, daemon=True),
            threading.Thread(target=self.monitor_clipboard, daemon=True),
            threading.Thread(target=self.monitor_processes, daemon=True),
            threading.Thread(target=self.monitor_network, daemon=True),
            threading.Thread(target=self.monitor_usb, daemon=True),
            threading.Thread(target=self.scan_files, daemon=True)
        ]
        
        for t in threads:
            t.start()
            
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.running = False
            print("Shutting down.")

if __name__ == "__main__":
    if not os.path.exists('config.json'):
        print("Error: config.json not found. Please download from the HRIP dashboard.")
        exit(1)
    
    agent = Agent()
    agent.start()
