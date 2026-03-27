# Frontend — Test Results

**Date:** 2026-03-12
**Tester:** Jonas
**Platforms:** iOS (physical iPhone 11, simulator) + Android (physical Pixel 7)

---

## Summary

* Total user flows: 11
* Passed: 11
* Bugs found: 1 (Android icons — fixed)

---

## User Flows (11/11 ✅)

* Login ✅
* Create habit ✅
* Edit habit ✅
* Delete habit ✅
* Mark complete + undo ✅
* Stats tab ✅
* Calendar in Stats ✅
* AI tab + insights ✅
* Tips modal ✅
* Profile tab ✅
* Logout ✅

---

## Platforms

* iOS (physical iPhone 11) ✅
* Android (physical Pixel 7) ✅

---

## Bugs Fixed

* Android: `IconSymbol` missing Material Icons mapping

  * Fix: Added all icons to `icon-symbol.tsx` mapping
