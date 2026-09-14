# Plan de mise à jour du contenu — Whazup

Ce fichier liste ce qui nécessite une vérification régulière, pour ne pas laisser le contenu se périmer silencieusement.

## 🔴 Priorité haute — événements datés saisis à la main

Contrairement aux événements OpenAgenda (qui se mettent à jour automatiquement), certains événements sont écrits en dur dans `app.js` (bloc `SEED_EVENTS`) avec une date précise. Une fois la date passée, l'événement reste affiché comme "à venir" jusqu'à suppression manuelle.

**À faire tous les mois environ :**
- Repérer les événements de `SEED_EVENTS` dont la date est dépassée
- Les remplacer par de nouveaux événements réels et à venir (rechercher sur le site officiel de la ville, ou une salle type "Le Phare" à Chambéry)
- Villes concernées actuellement : Chambéry (5 événements, mis à jour le 14/09/2026, à revérifier vers mi-octobre 2026)

## 🟡 Priorité moyenne — bars et lieux permanents (CURATED_BARS)

286 bars répartis sur 15 villes, avec adresses et parfois notes Google, dans `bar-places.js`. Ce contenu est figé au moment où il a été ajouté.

**Risques dans le temps :**
- Un bar peut fermer, déménager ou changer de nom
- Les notes Google évoluent en continu (celles enregistrées sont une photo à un instant T)

**À faire tous les 6 mois environ :**
- Vérifier un échantillon de bars par ville (les plus consultés si on a des statistiques) pour confirmer qu'ils existent toujours
- Rafraîchir les notes des villes qui en ont (Nantes, Bordeaux, Lille, Marseille, Montpellier, Rennes, Angers, Rouen, Reims, Brest)
- Villes sans notes pour l'instant, à compléter si l'occasion se présente : Toulouse, Paris, Strasbourg, Caen, Dijon, Chambéry

## 🟢 Pas d'action requise — sources OpenAgenda

Les événements OpenAgenda (`OPENAGENDA_SOURCES` dans `app.js`) se mettent à jour tout seuls à chaque chargement de l'appli, sans intervention. Seule chose à faire occasionnellement : chercher de **nouvelles** sources intéressantes (nouvelles salles, nouveaux festivals) pour enrichir la couverture.

## 🟢 Pas d'action requise — infrastructure technique

Depuis la mise à jour du `service-worker.js` du 14/09/2026 (stratégie "réseau d'abord"), il n'est plus nécessaire d'incrémenter manuellement `CACHE_NAME` à chaque changement de fichier. Le cache se renouvelle automatiquement.

---
*Dernière mise à jour de ce fichier : 14/09/2026*
