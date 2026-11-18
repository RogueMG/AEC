-- Catalogue schema: a category tree of any depth, products in any category, brands, images
-- and enquiries. D1 enforces foreign keys.

-- Categories nest through parent_id (NULL = top level).
CREATE TABLE categories (
  id            INTEGER PRIMARY KEY,
  parent_id     INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
  slug          TEXT    NOT NULL CHECK (slug <> '' AND slug NOT GLOB '*[^a-z0-9-]*'),
  title         TEXT    NOT NULL CHECK (title <> ''),
  summary       TEXT    NOT NULL DEFAULT '',
  -- An image is either an uploaded file in R2 (image_key) or an external link (image_url).
  image_key     TEXT,
  image_url     TEXT,
  image_alt     TEXT    NOT NULL DEFAULT '',
  tone          TEXT    NOT NULL DEFAULT 'auto'
                CHECK (tone IN ('auto', 'coral', 'yellow', 'teal', 'navy')),
  show_on_home  INTEGER NOT NULL DEFAULT 1 CHECK (show_on_home IN (0, 1)),
  made_in_house INTEGER NOT NULL DEFAULT 0 CHECK (made_in_house IN (0, 1)),
  sort_order    INTEGER NOT NULL DEFAULT 100,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK (image_key IS NULL OR image_url IS NULL)
);
-- Slugs are unique among siblings. COALESCE so top-level categories are compared too
-- (plain UNIQUE treats every NULL parent as distinct).
CREATE UNIQUE INDEX categories_sibling_slug ON categories (COALESCE(parent_id, 0), slug);
CREATE INDEX categories_parent ON categories (parent_id, sort_order);

CREATE TABLE brands (
  id          INTEGER PRIMARY KEY,
  slug        TEXT    NOT NULL UNIQUE CHECK (slug <> '' AND slug NOT GLOB '*[^a-z0-9-]*'),
  name        TEXT    NOT NULL CHECK (name <> ''),
  in_house    INTEGER NOT NULL DEFAULT 0 CHECK (in_house IN (0, 1)),
  logo_key    TEXT,
  logo_url    TEXT,
  logo_alt    TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 100,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK (logo_key IS NULL OR logo_url IS NULL)
);

CREATE TABLE products (
  id             INTEGER PRIMARY KEY,
  category_id    INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id       INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  slug           TEXT    NOT NULL CHECK (slug <> '' AND slug NOT GLOB '*[^a-z0-9-]*'),
  title          TEXT    NOT NULL CHECK (title <> ''),
  summary        TEXT    NOT NULL DEFAULT '',
  -- Sanitised HTML: p, h3, ul/li, strong, em.
  description    TEXT    NOT NULL DEFAULT '',
  -- JSON arrays: ["…"], [{"label":"…","value":"…"}], ["S","M"].
  key_features   TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(key_features) AND json_type(key_features) = 'array'),
  specifications TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(specifications) AND json_type(specifications) = 'array'),
  variants       TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(variants) AND json_type(variants) = 'array'),
  is_sample      INTEGER NOT NULL DEFAULT 0 CHECK (is_sample IN (0, 1)),
  published      INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
  sort_order     INTEGER NOT NULL DEFAULT 100,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (category_id, slug)
);
CREATE INDEX products_category ON products (category_id, published, sort_order);
CREATE INDEX products_brand ON products (brand_id);

-- The first image (lowest sort_order) is the product's main image.
CREATE TABLE product_images (
  id          INTEGER PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_key   TEXT,
  image_url   TEXT,
  alt         TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 100,
  CHECK ((image_key IS NULL) <> (image_url IS NULL))
);
CREATE INDEX product_images_product ON product_images (product_id, sort_order);

CREATE TABLE enquiries (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  company     TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  interest    TEXT NOT NULL DEFAULT '',
  message     TEXT NOT NULL,
  page        TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX enquiries_status ON enquiries (status, created_at);

-- Every URL path must mean exactly one thing: within a category, a product and a
-- sub-category can't share a slug.
CREATE TRIGGER products_slug_not_category_insert
BEFORE INSERT ON products
WHEN EXISTS (SELECT 1 FROM categories WHERE parent_id = NEW.category_id AND slug = NEW.slug)
BEGIN
  SELECT RAISE(ABORT, 'slug already used by a sub-category in this category');
END;

CREATE TRIGGER products_slug_not_category_update
BEFORE UPDATE OF slug, category_id ON products
WHEN EXISTS (SELECT 1 FROM categories WHERE parent_id = NEW.category_id AND slug = NEW.slug)
BEGIN
  SELECT RAISE(ABORT, 'slug already used by a sub-category in this category');
END;

CREATE TRIGGER categories_slug_not_product_insert
BEFORE INSERT ON categories
WHEN NEW.parent_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM products WHERE category_id = NEW.parent_id AND slug = NEW.slug)
BEGIN
  SELECT RAISE(ABORT, 'slug already used by a product in this category');
END;

CREATE TRIGGER categories_slug_not_product_update
BEFORE UPDATE OF slug, parent_id ON categories
WHEN NEW.parent_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM products WHERE category_id = NEW.parent_id AND slug = NEW.slug)
BEGIN
  SELECT RAISE(ABORT, 'slug already used by a product in this category');
END;

-- A category can't become its own parent. Deeper cycles (moving a category under one of its
-- own descendants) are rejected by the admin API, since triggers can't run recursive queries.
CREATE TRIGGER categories_not_own_parent
BEFORE UPDATE OF parent_id ON categories
WHEN NEW.parent_id = NEW.id
BEGIN
  SELECT RAISE(ABORT, 'a category cannot be its own parent');
END;
