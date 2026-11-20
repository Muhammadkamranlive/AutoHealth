#!/usr/bin/env bash
# Downloads diverse healthcare images to public/images/landing/
# Source: Pexels (free license) — https://www.pexels.com/license/

set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/public/images/landing"
mkdir -p "$DIR"
cd "$DIR"

download() {
  local name="$1"
  local url="$2"
  echo "Downloading $name..."
  curl -fsSL -o "$name" "$url"
}

download hero-group.jpg "https://images.pexels.com/photos/8460154/pexels-photo-8460154.jpeg?auto=compress&cs=tinysrgb&w=1280"
download header-banner-group.jpg "https://images.pexels.com/photos/7176318/pexels-photo-7176318.jpeg?auto=compress&cs=tinysrgb&w=1600"
download diverse-patients.jpg "https://images.pexels.com/photos/7176318/pexels-photo-7176318.jpeg?auto=compress&cs=tinysrgb&w=1280"
download team-black-physician.jpg "https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=800"
download team-asian-physician.jpg "https://images.pexels.com/photos/8460103/pexels-photo-8460103.jpeg?auto=compress&cs=tinysrgb&w=800"
download team-white-nurse.jpg "https://images.pexels.com/photos/6235049/pexels-photo-6235049.jpeg?auto=compress&cs=tinysrgb&w=800"
download team-latina-nurse.jpg "https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=800"
download service-primary.jpg "https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=800"
download service-prescription.jpg "https://images.pexels.com/photos/159211/headache-pain-pills-medication-159211.jpeg?auto=compress&cs=tinysrgb&w=800"
download service-chronic.jpg "https://images.pexels.com/photos/8460154/pexels-photo-8460154.jpeg?auto=compress&cs=tinysrgb&w=800"
download service-lab.jpg "https://images.pexels.com/photos/8460103/pexels-photo-8460103.jpeg?auto=compress&cs=tinysrgb&w=800"
download service-mental.jpg "https://images.pexels.com/photos/7176318/pexels-photo-7176318.jpeg?auto=compress&cs=tinysrgb&w=800"
download service-partner.jpg "https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=800"
download why-nurse-care.jpg "https://images.pexels.com/photos/6235049/pexels-photo-6235049.jpeg?auto=compress&cs=tinysrgb&w=800"
download why-doctor-consult.jpg "https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=800"
download patient-testimonial-1.jpg "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400"
download patient-testimonial-2.jpg "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400"
download patient-testimonial-3.jpg "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400"
download cta-hospital.jpg "https://images.pexels.com/photos/8460154/pexels-photo-8460154.jpeg?auto=compress&cs=tinysrgb&w=1280"

echo "Done. $(ls -1 *.jpg | wc -l | tr -d ' ') images in $DIR"
