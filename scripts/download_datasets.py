import csv
import logging
import tarfile
import urllib.request
import email
import email.policy
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "training"
RAW_DIR = DATA_DIR / "raw"
DATA_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)

DATASETS = [
    ("easy_ham.tar.bz2", "https://spamassassin.apache.org/old/publiccorpus/20030228_easy_ham.tar.bz2", 0),
    ("spam.tar.bz2", "https://spamassassin.apache.org/old/publiccorpus/20030228_spam.tar.bz2", 1),
    ("easy_ham_2.tar.bz2", "https://spamassassin.apache.org/old/publiccorpus/20030228_easy_ham_2.tar.bz2", 0),
    ("spam_2.tar.bz2", "https://spamassassin.apache.org/old/publiccorpus/20030228_spam_2.tar.bz2", 1)
]

def download_and_extract():
    for filename, url, label in DATASETS:
        tar_path = RAW_DIR / filename
        if not tar_path.exists():
            logging.info(f"Downloading {url}...")
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response, open(tar_path, 'wb') as out_file:
                    out_file.write(response.read())
            except Exception as e:
                logging.error(f"Failed to download {url}: {e}")
                continue
                
        folder_name = filename.split(".")[0]
        if not (RAW_DIR / folder_name).exists():
            logging.info(f"Extracting {filename}...")
            try:
                with tarfile.open(tar_path, "r:bz2") as tar:
                    tar.extractall(path=RAW_DIR)
            except Exception as e:
                logging.error(f"Failed to extract {filename}: {e}")

def get_email_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get('Content-Disposition'))
            if ctype == 'text/plain' and 'attachment' not in cdispo:
                return part.get_payload(decode=True)
    else:
        return msg.get_payload(decode=True)
    return None

def parse_to_csv():
    csv_path = DATA_DIR / "dataset.csv"
    logging.info(f"Writing parsed emails to {csv_path}...")
    
    count_ham = 0
    count_spam = 0
    
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label"])
        
        for filename, _, label in DATASETS:
            folder_name = filename.split(".")[0]
            folder_path = RAW_DIR / folder_name
            if not folder_path.exists():
                logging.warning(f"Directory {folder_path} does not exist, skipping.")
                continue
                
            for filepath in folder_path.iterdir():
                if filepath.is_file() and filepath.name != "cmds":
                    try:
                        with open(filepath, 'rb') as fp:
                            msg = email.message_from_binary_file(fp, policy=email.policy.default)
                            body = get_email_body(msg)
                            if body:
                                content = body.decode('utf-8', errors='ignore')
                                content = content.replace("\n", " ").replace("\r", " ").strip()
                                if len(content) > 10:
                                    writer.writerow([content, label])
                                    if label == 0: count_ham += 1
                                    else: count_spam += 1
                    except Exception as e:
                        pass
                        
    logging.info(f"Successfully parsed {count_ham} benign emails and {count_spam} spam/phishing emails.")

if __name__ == "__main__":
    download_and_extract()
    parse_to_csv()
