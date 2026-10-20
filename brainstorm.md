
I want to build RecipeForge: a web app that suggests recipes based on
ingredients the user already has at home.

Help me set the scope precisely. Brainstorm with me, give options.
Ask me one question at a time and keep your output short.

Cover: target user, pantry model (quantities? expiry dates?), ingredient
normalization, matching/scoring algorithm, substitutions, dietary filters,
shopping list, cook mode, recipe source (seed dataset vs user-created),
auth or no auth, what is MVP vs post-MVP.
Let’s define RecipeForge one decision at a time. I’ll keep track of your choices and turn them into a clear MVP and post-MVP plan.

Question 1 — Who is RecipeForge for?

Everyday home cooks — make meals from ingredients already available.


Budget-conscious students — save money and reduce food waste.


Busy people — find quick recipes with minimal effort.


Health-conscious users — find recipes matching dietary goals.


Everyone — a general-purpose recipe finder.

You can also reply with your own target audience. Next, we’ll decide how the pantry works: ingredient names, quantities, and expiry dates.

RecipeForge target user: Budget-conscious students. Ask me the next scope question.
Great — RecipeForge will help students cook affordable meals using what they already have.

Question 2 — How should the pantry work?

Simple pantry — users select ingredients they have. No quantities or expiry dates. Easiest MVP.


Ingredients + quantities — e.g., 4 eggs, 500 g rice. Better recipe matching.


Quantities + expiry dates — also prioritize ingredients that may expire soon. Helps reduce food waste.


Full pantry manager — quantities, expiry dates, opened status, and low-stock tracking.

My recommendation: ingredients + quantities. It provides useful matching without making students spend too much time maintaining their pantry.

RecipeForge pantry model: Quantities and expiry dates. Ask me the next scope question.
Question 3 — How should RecipeForge recognize ingredients?
For example, “tomato,” “tomatoes,” and “cherry tomatoes” are related, but not always interchangeable.


Basic normalization — standardize spelling, plurals, and capitalization.


Smart normalization — also recognize synonyms, common names, and equivalent units (e.g., scallions = green onions).


AI-powered recognition — interpret messy text, typos, and natural-language input like “half a bag of potatoes.”

My recommendation: Smart normalization for the MVP. It makes matching reliable without adding the cost and complexity of AI-powered parsing.

RecipeForge ingredient normalization: Smart normalization with synonyms, common names, and equivalent units. Ask me the next scope question.
Question 4 — How should recipes be matched and ranked?
When a student has some—but not all—required ingredients, what should RecipeForge prioritize?


Exact matches — show recipes only when every required ingredient is available.


Balanced scoring — rank by ingredients available, missing ingredients, cost, and expiry urgency.


Pantry-first — prioritize recipes using the most ingredients already at home.


Cheapest meals first — prioritize recipes requiring the least additional spending.

My recommendation: Balanced scoring. It fits budget-conscious students while helping them use ingredients before they expire.

RecipeForge matching and scoring: Balanced scoring by pantry coverage, missing ingredients, cost, and expiry urgency. Ask me the next scope question.
Question 5 — How should ingredient substitutions work?
For example, a recipe needs milk, but the student only has yogurt.


No substitutions — show missing ingredients only. Simplest MVP.


Basic substitutions — use a predefined database of common alternatives.


Smart substitutions — recommend alternatives based on the recipe, available pantry, and dietary restrictions.


AI-generated substitutions — let an LLM suggest creative alternatives for each recipe.

My recommendation: Smart substitutions using a curated database first, with AI as a possible later enhancement. This keeps costs predictable and recommendations more reliable.

RecipeForge substitutions: Predefined database of common substitutions. Ask me the next scope question.
Question 6 — Which dietary filters should RecipeForge support?
Students may have allergies, dietary preferences, or ingredients they avoid.


Basic filters — vegetarian, vegan, and gluten-free.


Standard filters — vegetarian, vegan, gluten-free, dairy-free, and nut-free.


Flexible filters — standard filters plus custom excluded ingredients and allergen exclusions.


Advanced dietary profiles — all of the above plus keto, halal, high-protein, and other dietary preferences.

My recommendation: Flexible filters. They offer students useful control without making the first version overly complicated. Allergy-related filters should be treated cautiously because ingredient data and substitutions may not guarantee safety.

RecipeForge dietary filters: Vegetarian, vegan, gluten-free, dairy-free, and nut-free. Ask me the next scope question.
Question 7 — Should RecipeForge generate a shopping list?
When a recipe requires ingredients the student doesn't have, what should happen?


No shopping list — simply display missing ingredients.


Manual list — users can add missing ingredients to a shopping list themselves.


Automatic list — add missing recipe ingredients to a list, with quantities and duplicate merging.


Budget-aware list — automatic list plus estimated costs and prioritization of cheaper options.

My recommendation: Automatic shopping list for the MVP. Budget estimates can come later because prices vary by store and location.

RecipeForge shopping list: Budget-aware automatic shopping list with estimated costs and cheaper options. Ask me the next scope question.
Question 8 — Should RecipeForge have a cook mode?
How should the app guide students while they prepare a meal?


Basic recipe page — ingredients, instructions, cooking time, and servings.


Guided cook mode — step-by-step instructions, checkboxes, and timers.


Advanced cook mode — guided steps, multiple timers, adjustable servings, and ingredient quantity updates.


AI cooking assistant — everything above plus interactive help and troubleshooting.

My recommendation: Guided cook mode. Step-by-step instructions and simple timers make recipes easier for students without requiring an AI assistant in the first release.

RecipeForge cook mode: Guided step-by-step cook mode with checkboxes and timers. Ask me the next scope question.
Question 9 — Where should recipes come from?
RecipeForge needs a reliable collection of recipes to match against students’ pantry ingredients.


Curated seed dataset — start with a fixed collection of recipes. Fastest and easiest MVP.


External recipe API — fetch recipes from a third-party provider. Broader selection, but may involve costs and usage limits.


User-created recipes — students add and manage their own recipes.


Hybrid — curated starter dataset plus user-created recipes, with external APIs later.

My recommendation: Curated seed dataset for the MVP. You control ingredient names, quantities, costs, and dietary labels, making matching much easier to implement and test.


RecipeForge recipe source: Curated starter dataset plus user-created recipes, external API later. Ask me the next scope question.
Question 10 — Should users have accounts?
This determines how RecipeForge saves pantry items, recipes, and shopping lists.


No accounts — save everything in the browser. Simplest MVP, but data won't sync across devices.


Accounts required — sign up and log in to save pantry data and recipes across devices.


Optional accounts — use locally without an account, with sign-in available for cloud sync.

My recommendation: No accounts for the MVP. Pantry management already requires effort, so reducing setup friction is valuable for students. Cloud sync can come later.

RecipeForge authentication: Accounts required with cloud-saved data. Ask me the next scope question.
Question 11 — What belongs in the MVP?
We’ve defined the main features. Now let’s decide how much to build in the first release.


Core MVP — accounts, pantry with quantities and expiry dates, recipe matching, dietary filters, substitutions, and saved recipes.


Balanced MVP — everything above plus budget-aware shopping lists and guided cook mode.


Full MVP — all planned features, including detailed cost estimates, advanced pantry tracking, and a polished cooking experience.

My recommendation: Balanced MVP. It delivers RecipeForge’s main value—affordable meals from ingredients at home—without needing an external recipe API at launch.

RecipeForge MVP scope: Balanced MVP: core features plus budget-aware shopping lists and guided cook mode. Ask me the next scope question.
Question 12 — What should come after the MVP?
Choose which features to postpone until RecipeForge’s core experience works reliably.


Smart upgrades — external recipe API, AI cooking assistant, and smarter substitutions.


Community features — public recipe sharing, ratings, reviews, and following other cooks.


Advanced tracking — barcode scanning, nutrition tracking, pantry alerts, and price comparisons.


All of the above — build these gradually after validating the MVP.

My recommendation: All of the above, gradually. Prioritize features based on student feedback rather than trying to build everything immediately.

RecipeForge post-MVP roadmap: Gradually add smart upgrades, community features, and advanced tracking. Ask me the next scope question.
Question 13 — How should RecipeForge estimate meal costs?
Since your target users are budget-conscious students, cost estimates are a key feature.


Manual price database — store approximate ingredient prices and update them yourself.


Regional estimates — use average prices for the user's country or region, such as Kazakhstan.


User-defined prices — let users enter prices from their own shopping trips.


Hybrid — regional default prices, editable by users, with estimated cost per serving.

My recommendation: Hybrid. It gives students useful estimates immediately while allowing them to correct prices to match their actual shops. Prices should be labeled estimates, not guaranteed current prices.

RecipeForge cost estimation: Hybrid regional default prices editable by users, with cost per serving. Ask me the next scope question.
Question 14 — How should students enter pantry ingredients?
This determines how quickly users can start finding recipes.


Search and select — type an ingredient and choose it from a standardized list.


Quick text entry — type several ingredients at once, like “eggs, rice, tomatoes.”


Both methods — searchable ingredient picker plus bulk text entry with automatic normalization.


Photo recognition — upload a photo of groceries and let AI identify ingredients.

My recommendation: Both methods. Students can add ingredients individually or enter a whole list quickly, without the cost and complexity of image recognition.

RecipeForge pantry entry: Searchable picker plus bulk text entry with automatic normalization. Ask me the next scope question.
Question 15 — How many recipes should each search return?
RecipeForge needs enough options without overwhelming students.


6 recipes — fast, focused results.


12 recipes — a balanced choice for the MVP.


20 recipes — more variety, especially with partial ingredient matches.


All matching recipes — show everything, with pagination or infinite scrolling.

My recommendation: 12 recipes per search, ranked by pantry coverage, missing ingredients, estimated cost, and expiry urgency.

RecipeForge search results: 12 recipes per search. Ask me the next scope question.
Question 16 — How should RecipeForge handle expiry dates?
You chose quantities and expiry dates for the pantry. Now we need to decide how expiry affects recipe recommendations.


Display only — show expiry dates in the pantry, without changing recipe rankings.


Prioritize expiring ingredients — boost recipes that use ingredients nearing their expiry date.


Prioritize + alerts — also notify users when ingredients are nearing expiry.


Strict expiry handling — exclude expired ingredients from recipe matching and warn users about them.

My recommendation: Prioritize + alerts, while treating dates as user-entered estimates. For food safety, the app should not assume an item is safe just because its date has not passed. Expired items should be flagged clearly.

RecipeForge expiry handling: Boost recipes that use ingredients nearing expiry. Ask me the next scope question.
Question 17 — How should users save their favorite recipes?
Since RecipeForge requires accounts with cloud storage, we can support different levels of personalization.


Favorites only — bookmark recipes for later.


Collections — organize recipes into folders like “Cheap meals,” “Breakfast,” and “Dinner.”


Favorites + history — save favorites and automatically track recently viewed or cooked recipes.


Full recipe library — favorites, collections, cooking history, personal notes, and ratings.

My recommendation: Favorites + history for the MVP. It adds useful personalization without building a complicated recipe organization system.

RecipeForge saved recipes: Favorites plus recently viewed and cooked history. Ask me the next scope question.
Question 18 — What technology should power RecipeForge?
This choice shapes development speed, authentication, database storage, and deployment.


Modern TypeScript stack — Next.js + TypeScript + Supabase (PostgreSQL, authentication, cloud storage).


Python backend — React + FastAPI + PostgreSQL, with authentication handled by the backend.


Managed backend — Next.js + TypeScript + Firebase for authentication and cloud data.


Custom architecture — choose the frontend, backend, database, and hosting independently.

My recommendation: Next.js + TypeScript + Supabase. It provides cloud accounts and a relational database without requiring you to build authentication and infrastructure from scratch.

RecipeForge technology stack: React + FastAPI + PostgreSQL with backend-managed authentication. Ask me the next scope question.
Question 19 — How should the recipe dataset be created?
You chose a curated starter dataset plus user-created recipes, with external APIs later. Now let's decide how to populate the starter collection.


Hand-curated dataset — start with around 100 tested recipes, entered manually with structured ingredients, steps, and estimated costs.


Open recipe dataset — import recipes from a dataset with suitable reuse rights, then normalize the data.


Hybrid dataset — use an openly licensed dataset as a base and manually review the best student-friendly recipes.


Small prototype — start with 30–50 recipes to validate matching before expanding.

My recommendation: Hybrid dataset. It gives you enough variety to test matching while keeping recipe quality, ingredient quantities, dietary labels, and cost estimates under control.
RecipeForge starter dataset: Start with 30–50 recipes and expand after validating matching. Ask me the next scope question.
Question 20 — How should RecipeForge handle servings?
A recipe may serve two people, while a student might want to cook just one portion or prepare meals for several days.


Fixed servings — show the recipe's original portions only.


Adjustable servings — users change portions, and ingredient quantities scale automatically.


Meal-prep mode — adjustable servings plus batch cooking and leftover planning.


Student portions — adjustable servings plus estimated cost per portion and meal-prep suggestions.

My recommendation: Student portions. It directly supports your budget-conscious audience and fits naturally with RecipeForge's cost-per-serving calculations.

RecipeForge servings: Adjustable servings with automatically scaled ingredient quantities. Ask me the next scope question.
Question 21 — How should RecipeForge handle ingredient quantities it can't scale automatically?
For example, doubling a recipe from 2 to 4 servings is easy for grams, but “1 egg” or “a pinch of salt” needs sensible handling.


Simple math — multiply every quantity by the serving ratio.


Smart scaling — scale measurable quantities, round countable items sensibly, and preserve “to taste” amounts.


Manual adjustment — scale standard quantities but let users edit every ingredient afterward.

My recommendation: Smart scaling. It makes serving adjustments practical for real cooking without adding much complexity.

That's enough questions. Save everything to a markdown file I can download.
Include Q1-Q20 decisions: product vision, target user, user stories, entities,
scoring formula, normalization rules, dietary rules, substitution rules,
shopping list rules, cook mode, pricing (KZT), pantry input, pagination,
expiry rules, favorites/history, servings, dataset plan, tech stack,
MVP list, post-MVP waves, edge cases, open questions.

Data analysis isn't available right now. Do you want to continue without it?

ok
I can still help with RecipeForge. The downloadable file tool is temporarily unavailable.

You can ask me again to create RecipeForge_.md, and I can try generating the file when the tool is available.

just save everything to markdown file plan.md

Обработка заняла 29s
Saved the complete RecipeForge scope, including all confirmed decisions, MVP features, scoring formula, data model, tech stack, roadmap, edge cases, and open questions.

Download plan.md


plan.md

