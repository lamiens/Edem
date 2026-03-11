# Edem - Crée tes propres histoires magiques

Application mobile de création d'histoires interactives pour enfants, mettant en valeur les héros afro-descendants du monde entier.

## Fonctionnalités

- **Création guidée** : L'enfant répond à des questions pour construire son histoire
- **Héros afro-descendants** : Personnages des Caraïbes, d'Afrique, des États-Unis, d'Europe, de l'Océan Indien...
- **Photo personnalisée** : L'enfant se prend en photo pour devenir le héros
- **IA Générative** : Les histoires sont créées par l'IA (OpenAI) ou en mode hors-ligne
- **Bibliothèque** : Toutes les histoires créées sont sauvegardées localement

## Installation

```bash
npm install
```

## Lancement

```bash
npx expo start
```

Puis scanner le QR code avec Expo Go (iOS/Android).

## Configuration IA (optionnel)

Dans les paramètres de l'app, ajouter une clé API OpenAI pour activer la génération d'histoires par IA. Sans clé, l'app fonctionne avec des histoires pré-écrites personnalisées.

## Stack technique

- React Native + Expo SDK 52
- Expo Router (navigation)
- TypeScript
- expo-camera / expo-image-picker
- AsyncStorage (stockage local)
- OpenAI GPT-4o-mini (génération d'histoires)
# Edem
