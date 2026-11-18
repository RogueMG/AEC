# Editing the website: a guide for the admin

This guide is for whoever keeps the Asiatic Engineering Co. catalogue up to date. You don't need
any technical knowledge. Everything happens in the admin, in your web browser.

## Signing in

1. Go to the site's address followed by **/admin**, for example
   `https://asiatic-engineering.pages.dev/admin` (or your own domain once it's connected).
2. Cloudflare shows a sign-in page called **"Log in to AEC admin"**. Type your email address and
   click **Send login code**.
3. Check your email for a code from Cloudflare and type it in. There is no password to remember.
4. You land in the admin, with your email shown at the top right.

Only email addresses on the admin's allow-list can sign in. To add or remove someone, see
[Who can sign in](#who-can-sign-in) below. **Sign out** (top right) ends your session on that
computer; otherwise it lasts for the session length set in Cloudflare Access (24 hours was suggested at setup).

The admin has three tabs at the top: **Catalogue**, **Brands** and **Enquiries**. **View site**
opens the public site in a new tab so you can check your changes.

## How the catalogue is organised

- **Categories** can sit inside other categories, as deep as you like. For example:
  *Safety / PPE* → *Gloves* → *Cotton knitted gloves*.
- **Products** always belong to one category.
- Each category and product gets its own page on the site. Its address is made from the
  **slugs** of everything above it, e.g. `/products/safety-ppe/cotton-knitted-industrial-gloves`.

Changes appear on the public site **within about a minute** of saving.

## The Catalogue tab

On the left is the catalogue tree. Click a category's arrow to open or close it.

| To… | Do this |
| --- | --- |
| Edit a category or product | Click its name. The form opens on the right. |
| Add a main (top-level) category | Click **New category** at the top of the tree. |
| Add a sub-category or a product | Use the two small icons on that category's row: the folder (**Add sub-category**) and the box (**Add product**). Hover over them to see which is which. |
| Change the order | Use the **up / down arrows** on a row. The site shows things in this order. |
| Move something to another category | Open it and change **Inside** (categories) or **Category** (products), then save. |

Products that aren't published are marked **Draft** in the tree.

### Saving

- The **Save** button sticks to the top of the form. It says **Save changes** while you have
  unsaved edits and **Saved** once everything is stored.
- If you try to leave a form with unsaved changes, the admin asks you first.
- If something is wrong (for example a slug that's already used), a message explains what to fix.

## Editing a category

| Field | What it's for |
| --- | --- |
| **Title** | The name shown on the site. |
| **Slug** | The part of the page address, e.g. `safety-ppe`. It's filled in from the title automatically. Use only lowercase letters, numbers and hyphens. **Changing it changes the page's address**, so links people have saved will stop working; avoid changing it once the site is live. |
| **Inside** | Which category it sits in. Choose **Top level** for a main category. |
| **Summary** | One or two sentences, shown on the category's tile and at the top of its page. Search engines use it too, so make it describe the range. |
| **Image** | The category's photo (see [Photos](#photos)). |
| **Tile colour** | The colour block for its tile. **Automatic** cycles through coral, yellow, teal and navy. |
| **Show on home page** | Main categories only appear on the home page when this is on. |
| **Made in-house** | Shows the "Made in-house" badge (for ranges made at the Sriperumbudur factory). |

**Deleting a category:** it must be empty first. Move or delete its sub-categories and products,
then use **Delete category** at the bottom of the form. You'll be asked to confirm. This can't be
undone.

## Editing a product

**Basics**

| Field | What it's for |
| --- | --- |
| **Title** | The product's name. |
| **Slug** | The last part of its page address, filled in from the title. Same advice as for categories: don't change it once the page is live. |
| **Category** | Which category it belongs to. |
| **Brand** | The maker. Choose the in-house brand for products you make yourselves. Leave it empty if there's no brand. |
| **Summary** | One or two sentences for product cards and the top of the page. |
| **Published** | Turn **off** to keep it as a draft: it's saved, but hidden from the site. |
| **Sample listing** | Shows the note "Sample listing. Details are still to be confirmed" on the page. The starter products have it on; turn it off once a product's details are real. |

**Images:** add as many as you like (see [Photos](#photos)). **The first image is the main one**,
used on product cards and when the page is shared. Use the arrows to change the order.

**Details**

- **Description:** the main text. The toolbar offers paragraphs, headings, bullet lists, **bold** and
  *italic*. Anything else pasted in (colours, fonts, tables) is removed when you save, so the site
  stays consistent.
- **Key features:** short points, one per row ("Add a feature").
- **Specifications:** label and value pairs, e.g. *Material: 100% cotton*.
- **Sizes / variants:** one per row, e.g. *S, M, L* or *4 inch*.

**Deleting a product:** use **Delete product** at the bottom. The product and its images are removed
from the site. This can't be undone. If you might want it back, turn off **Published** instead.

## Photos

- Click **Upload image** (or **Upload images** for a product) and choose files from your computer (WebP, JPEG, PNG or AVIF).
- Photos are **shrunk automatically** before they're uploaded (to at most 1600 pixels), so you can
  upload straight from a phone or camera. Each file must still be under 5 MB.
- Alternatively, paste a link to an image that's already online (it must start with `https://`).
- **Every image needs alt text**: a few words saying what it shows, e.g. *"White cotton knitted
  gloves on a workbench"*. It's read out to people who can't see the image and helps search
  engines. The admin won't save until every image has it.
- Photos you remove are deleted from storage automatically once nothing uses them.

Good photos make the biggest difference to the site. Clear, well-lit pictures of real products
work better than stock photos.

## The Brands tab

The list on the left is every brand, in the order the site shows them. **The home page names the
first three dealer brands**, so put the most important ones at the top with the arrows.

| Field | What it's for |
| --- | --- |
| **Name** | The brand's name. |
| **Slug** | Filled in from the name; letters, numbers and hyphens. |
| **Our own products (in-house)** | Marks the company's own brand. It's not listed among the dealer brands. |
| **Logo (optional)** | The brand's logo. Without one, the brand's name is shown in text. |

Deleting a brand doesn't delete its products; they just show no brand.

## The Enquiries tab

Every enquiry sent through the website's form lands here. The number on the **Enquiries** tab shows
how many are new.

- **New / Read / Archived:** the three lists, with counts. Opening a new enquiry moves it to Read.
- Each enquiry shows the person's details, what they're looking for, their message, the date, and
  **which page they sent it from**.
- **Reply buttons:** **Reply by email** (opens your email program with the subject and their message
  quoted), **WhatsApp** (Indian numbers get the 91 country code added automatically) and **Call**.
  A button only appears if they gave that detail.
- **Archive** when it's dealt with; **Move back to inbox** brings it back. **Mark as new** if you
  want to come back to it.
- **Delete** is for spam. It asks you to confirm and can't be undone. For real enquiries, archive
  instead.
- **"Not emailed" / "Email sent":** whether an email notification went out when it arrived. Until
  email notifications are set up (they need the custom domain), every enquiry says "Not emailed".
  Nothing is lost: the inbox always has every enquiry.

The form has built-in spam protection (a hidden bot trap, a limit of five enquiries per hour per
visitor, and Cloudflare's "are you human" check), so very little junk should reach you.

## Who can sign in

Access to the admin is controlled by **Cloudflare Access**, not by the website itself. To let
someone else in, or take someone out:

1. In the Cloudflare dashboard, open **Zero Trust** → **Access** → **Applications** → **AEC admin**.
2. Edit the **Admins** policy and add or remove email addresses under **Emails**.
3. Save. The change takes effect for their next sign-in.

## If something goes wrong

- **"Your sign-in has expired"**: reload the page and sign in again.
- **A save is refused:** read the message under the field; it says what to change (for example,
  a slug that's already used by a neighbour).
- **The site doesn't show a change yet:** wait a minute and reload; pages are cached briefly.
- **Something looks broken:** note the page and what you clicked, and contact whoever looks after
  the site.
