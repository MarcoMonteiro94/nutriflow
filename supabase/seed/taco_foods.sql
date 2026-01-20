-- TACO (Tabela Brasileira de Composição de Alimentos) Food Database Seed
-- Source: NEPA/UNICAMP - Tabela Brasileira de Composição de Alimentos (TACO) 4ª Edição
-- Values per 100g portion

-- Cereais e derivados
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Arroz, integral, cozido', 124, 2.6, 25.8, 1.0, 2.7, 1, 100, 'g', 'Cereais e derivados', 'official'),
('Arroz, tipo 1, cozido', 128, 2.5, 28.1, 0.2, 1.6, 1, 100, 'g', 'Cereais e derivados', 'official'),
('Aveia, flocos, crua', 394, 14.0, 66.6, 8.5, 9.1, 5, 100, 'g', 'Cereais e derivados', 'official'),
('Farinha de mandioca, crua', 361, 1.6, 87.9, 0.3, 6.4, 0, 100, 'g', 'Cereais e derivados', 'official'),
('Farinha de trigo, integral', 360, 11.4, 75.2, 1.9, 6.0, 1, 100, 'g', 'Cereais e derivados', 'official'),
('Macarrão, trigo, cru', 371, 10.0, 77.9, 1.2, 2.9, 2, 100, 'g', 'Cereais e derivados', 'official'),
('Macarrão, trigo, cozido', 102, 3.4, 19.9, 0.5, 1.5, 1, 100, 'g', 'Cereais e derivados', 'official'),
('Pão, francês', 300, 8.0, 58.6, 3.1, 2.3, 648, 100, 'g', 'Cereais e derivados', 'official'),
('Pão, integral, trigo', 253, 9.4, 49.9, 3.4, 6.9, 474, 100, 'g', 'Cereais e derivados', 'official'),
('Tapioca, goma, crua', 343, 0.0, 84.5, 0.2, 0.5, 0, 100, 'g', 'Cereais e derivados', 'official');

-- Verduras, hortaliças e derivados
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Abóbora, moranga, cozida', 17, 0.8, 3.7, 0.1, 1.6, 0, 100, 'g', 'Verduras e hortaliças', 'official'),
('Abobrinha, italiana, crua', 19, 1.4, 3.0, 0.4, 1.4, 1, 100, 'g', 'Verduras e hortaliças', 'official'),
('Acelga, crua', 21, 2.3, 2.8, 0.3, 3.2, 126, 100, 'g', 'Verduras e hortaliças', 'official'),
('Agrião, cru', 17, 2.7, 2.3, 0.2, 2.1, 8, 100, 'g', 'Verduras e hortaliças', 'official'),
('Alface, americana, crua', 8, 0.7, 1.3, 0.1, 0.8, 6, 100, 'g', 'Verduras e hortaliças', 'official'),
('Alface, crespa, crua', 11, 1.3, 1.7, 0.2, 2.0, 3, 100, 'g', 'Verduras e hortaliças', 'official'),
('Batata, inglesa, cozida', 52, 1.2, 11.9, 0.0, 1.3, 2, 100, 'g', 'Verduras e hortaliças', 'official'),
('Batata doce, cozida', 77, 0.6, 18.4, 0.1, 2.2, 15, 100, 'g', 'Verduras e hortaliças', 'official'),
('Berinjela, cozida', 19, 0.7, 4.5, 0.1, 2.5, 0, 100, 'g', 'Verduras e hortaliças', 'official'),
('Beterraba, crua', 49, 1.9, 11.1, 0.1, 3.4, 59, 100, 'g', 'Verduras e hortaliças', 'official'),
('Brócolis, cozido', 25, 2.1, 4.4, 0.5, 3.4, 10, 100, 'g', 'Verduras e hortaliças', 'official'),
('Cenoura, crua', 34, 1.3, 7.7, 0.2, 3.2, 3, 100, 'g', 'Verduras e hortaliças', 'official'),
('Couve-flor, cozida', 19, 1.2, 3.9, 0.2, 2.1, 1, 100, 'g', 'Verduras e hortaliças', 'official'),
('Couve, manteiga, crua', 27, 2.9, 4.3, 0.5, 3.1, 40, 100, 'g', 'Verduras e hortaliças', 'official'),
('Espinafre, cru', 16, 2.0, 2.6, 0.2, 2.1, 50, 100, 'g', 'Verduras e hortaliças', 'official'),
('Mandioca, cozida', 125, 0.6, 30.1, 0.3, 1.6, 3, 100, 'g', 'Verduras e hortaliças', 'official'),
('Pepino, cru', 10, 0.9, 2.0, 0.0, 1.1, 1, 100, 'g', 'Verduras e hortaliças', 'official'),
('Repolho, cru', 17, 0.9, 3.8, 0.1, 1.9, 12, 100, 'g', 'Verduras e hortaliças', 'official'),
('Tomate, cru', 15, 1.1, 3.1, 0.2, 1.2, 2, 100, 'g', 'Verduras e hortaliças', 'official'),
('Vagem, cozida', 25, 1.5, 5.4, 0.2, 2.4, 2, 100, 'g', 'Verduras e hortaliças', 'official');

-- Frutas e derivados
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Abacate, cru', 96, 1.2, 6.0, 8.4, 6.3, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Abacaxi, cru', 48, 0.9, 12.3, 0.1, 1.0, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Açaí, polpa, congelada', 58, 0.8, 6.2, 3.9, 2.6, 5, 100, 'g', 'Frutas e derivados', 'official'),
('Banana, nanica, crua', 92, 1.4, 23.8, 0.1, 1.9, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Banana, prata, crua', 98, 1.3, 26.0, 0.1, 2.0, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Coco, cru', 406, 3.7, 10.4, 42.0, 5.4, 8, 100, 'g', 'Frutas e derivados', 'official'),
('Goiaba, vermelha, crua', 54, 1.1, 13.0, 0.4, 6.2, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Kiwi, cru', 51, 0.9, 11.5, 0.6, 2.7, 4, 100, 'g', 'Frutas e derivados', 'official'),
('Laranja, pêra, crua', 37, 1.0, 8.9, 0.1, 0.8, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Limão, cru', 32, 0.9, 11.1, 0.1, 1.2, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Maçã, Fuji, crua', 56, 0.3, 15.2, 0.0, 1.3, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Mamão, formosa, cru', 45, 0.8, 11.6, 0.1, 1.8, 3, 100, 'g', 'Frutas e derivados', 'official'),
('Manga, Palmer, crua', 72, 0.4, 19.4, 0.2, 2.1, 2, 100, 'g', 'Frutas e derivados', 'official'),
('Maracujá, cru', 68, 2.0, 12.3, 2.1, 1.1, 3, 100, 'g', 'Frutas e derivados', 'official'),
('Melancia, crua', 33, 0.9, 8.1, 0.0, 0.1, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Melão, cru', 29, 0.7, 7.5, 0.0, 0.3, 11, 100, 'g', 'Frutas e derivados', 'official'),
('Morango, cru', 30, 0.9, 6.8, 0.3, 1.7, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Pêra, Williams, crua', 53, 0.6, 14.0, 0.1, 3.0, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Uva, Itália, crua', 53, 0.7, 13.6, 0.2, 0.9, 0, 100, 'g', 'Frutas e derivados', 'official'),
('Uva, rubi, crua', 49, 0.6, 12.7, 0.2, 0.7, 0, 100, 'g', 'Frutas e derivados', 'official');

-- Gorduras e óleos
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Azeite de oliva, extra virgem', 884, 0.0, 0.0, 100.0, 0.0, 0, 100, 'g', 'Gorduras e óleos', 'official'),
('Manteiga, com sal', 726, 0.4, 0.0, 82.4, 0.0, 579, 100, 'g', 'Gorduras e óleos', 'official'),
('Margarina, com sal', 596, 0.0, 0.3, 67.0, 0.0, 818, 100, 'g', 'Gorduras e óleos', 'official'),
('Óleo de coco', 862, 0.0, 0.0, 100.0, 0.0, 0, 100, 'g', 'Gorduras e óleos', 'official'),
('Óleo de soja', 884, 0.0, 0.0, 100.0, 0.0, 0, 100, 'g', 'Gorduras e óleos', 'official');

-- Pescados e frutos do mar
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Atum, em conserva', 166, 26.2, 0.0, 6.8, 0.0, 398, 100, 'g', 'Pescados e frutos do mar', 'official'),
('Bacalhau, salgado, cru', 136, 29.0, 0.0, 1.9, 0.0, 17760, 100, 'g', 'Pescados e frutos do mar', 'official'),
('Camarão, cozido', 90, 18.4, 0.0, 1.3, 0.0, 263, 100, 'g', 'Pescados e frutos do mar', 'official'),
('Peixe, merluza, filé, cru', 89, 16.6, 0.0, 2.3, 0.0, 80, 100, 'g', 'Pescados e frutos do mar', 'official'),
('Peixe, sardinha, inteira, assada', 164, 32.2, 0.0, 3.4, 0.0, 500, 100, 'g', 'Pescados e frutos do mar', 'official'),
('Peixe, tilápia, filé, cru', 86, 18.5, 0.0, 1.1, 0.0, 52, 100, 'g', 'Pescados e frutos do mar', 'official'),
('Salmão, cru', 170, 19.3, 0.0, 10.0, 0.0, 36, 100, 'g', 'Pescados e frutos do mar', 'official');

-- Carnes e derivados
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Carne, bovina, acém, cozido', 215, 26.7, 0.0, 11.4, 0.0, 42, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, bovina, alcatra, grelhada', 235, 32.8, 0.0, 10.9, 0.0, 50, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, bovina, contrafilé, grelhado', 273, 32.4, 0.0, 15.3, 0.0, 55, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, bovina, costela, assada', 373, 28.8, 0.0, 28.2, 0.0, 50, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, bovina, fígado, grelhado', 225, 29.1, 4.3, 9.8, 0.0, 75, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, bovina, maminha, grelhada', 153, 28.4, 0.0, 3.8, 0.0, 55, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, bovina, patinho, cozido', 219, 35.9, 0.0, 7.3, 0.0, 47, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, bovina, músculo, cozido', 192, 32.4, 0.0, 6.1, 0.0, 41, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, suína, bisteca, grelhada', 220, 28.1, 0.0, 11.3, 0.0, 66, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, suína, lombo, assado', 210, 32.0, 0.0, 8.4, 0.0, 59, 100, 'g', 'Carnes e derivados', 'official'),
('Carne, suína, pernil, assado', 262, 27.6, 0.0, 16.0, 0.0, 79, 100, 'g', 'Carnes e derivados', 'official'),
('Frango, coxa, cozida, com pele', 215, 26.2, 0.0, 11.7, 0.0, 73, 100, 'g', 'Carnes e derivados', 'official'),
('Frango, coxa, cozida, sem pele', 163, 26.8, 0.0, 5.6, 0.0, 87, 100, 'g', 'Carnes e derivados', 'official'),
('Frango, peito, sem pele, grelhado', 159, 32.0, 0.0, 2.5, 0.0, 42, 100, 'g', 'Carnes e derivados', 'official'),
('Frango, sobrecoxa, cozida, sem pele', 176, 26.8, 0.0, 7.0, 0.0, 86, 100, 'g', 'Carnes e derivados', 'official'),
('Peru, peito, sem pele, assado', 151, 29.1, 0.0, 3.1, 0.0, 73, 100, 'g', 'Carnes e derivados', 'official');

-- Leite e derivados
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Iogurte, natural', 51, 4.1, 6.1, 1.0, 0.0, 55, 100, 'g', 'Leite e derivados', 'official'),
('Iogurte, natural, desnatado', 42, 4.2, 6.3, 0.3, 0.0, 58, 100, 'g', 'Leite e derivados', 'official'),
('Leite de vaca, integral', 61, 3.0, 4.5, 3.5, 0.0, 42, 100, 'g', 'Leite e derivados', 'official'),
('Leite de vaca, desnatado', 35, 3.4, 5.0, 0.2, 0.0, 45, 100, 'g', 'Leite e derivados', 'official'),
('Queijo, minas, frescal', 264, 17.4, 3.2, 20.2, 0.0, 31, 100, 'g', 'Leite e derivados', 'official'),
('Queijo, muçarela', 330, 22.6, 3.0, 25.2, 0.0, 581, 100, 'g', 'Leite e derivados', 'official'),
('Queijo, parmesão', 453, 35.6, 0.0, 33.5, 0.0, 1844, 100, 'g', 'Leite e derivados', 'official'),
('Queijo, prato', 360, 22.7, 1.9, 29.1, 0.0, 620, 100, 'g', 'Leite e derivados', 'official'),
('Queijo, cottage', 98, 11.1, 2.7, 4.3, 0.0, 405, 100, 'g', 'Leite e derivados', 'official'),
('Requeijão, cremoso', 257, 4.6, 1.6, 25.8, 0.0, 421, 100, 'g', 'Leite e derivados', 'official'),
('Ricota', 140, 12.6, 3.8, 8.1, 0.0, 205, 100, 'g', 'Leite e derivados', 'official');

-- Leguminosas e derivados
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Ervilha, em conserva, drenada', 63, 3.8, 10.0, 0.4, 4.1, 270, 100, 'g', 'Leguminosas e derivados', 'official'),
('Feijão, branco, cozido', 102, 6.5, 17.1, 0.6, 6.3, 5, 100, 'g', 'Leguminosas e derivados', 'official'),
('Feijão, carioca, cozido', 76, 4.8, 13.6, 0.5, 8.5, 2, 100, 'g', 'Leguminosas e derivados', 'official'),
('Feijão, preto, cozido', 77, 4.5, 14.0, 0.5, 8.4, 2, 100, 'g', 'Leguminosas e derivados', 'official'),
('Grão-de-bico, cozido', 130, 6.7, 21.2, 2.1, 5.1, 185, 100, 'g', 'Leguminosas e derivados', 'official'),
('Lentilha, cozida', 93, 6.3, 16.3, 0.5, 7.9, 2, 100, 'g', 'Leguminosas e derivados', 'official'),
('Soja, em grão, cozida', 151, 14.0, 7.6, 7.6, 5.6, 1, 100, 'g', 'Leguminosas e derivados', 'official');

-- Nozes e sementes
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Amendoim, torrado, salgado', 606, 22.5, 17.1, 50.1, 7.8, 389, 100, 'g', 'Nozes e sementes', 'official'),
('Castanha de caju, torrada', 570, 18.5, 29.1, 46.3, 3.7, 200, 100, 'g', 'Nozes e sementes', 'official'),
('Castanha-do-pará, crua', 643, 14.5, 15.1, 63.5, 7.9, 2, 100, 'g', 'Nozes e sementes', 'official'),
('Chia, semente', 486, 16.5, 42.1, 30.7, 34.4, 16, 100, 'g', 'Nozes e sementes', 'official'),
('Linhaça, semente', 495, 14.1, 43.3, 32.3, 33.5, 34, 100, 'g', 'Nozes e sementes', 'official'),
('Noz, crua', 620, 14.0, 18.4, 59.0, 5.2, 2, 100, 'g', 'Nozes e sementes', 'official');

-- Ovos e derivados
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Ovo, de galinha, inteiro, cozido', 146, 13.3, 0.6, 10.0, 0.0, 146, 100, 'g', 'Ovos e derivados', 'official'),
('Ovo, de galinha, inteiro, frito', 240, 15.6, 1.2, 19.3, 0.0, 467, 100, 'g', 'Ovos e derivados', 'official'),
('Ovo, de galinha, clara, cozida', 59, 12.6, 1.0, 0.3, 0.0, 184, 100, 'g', 'Ovos e derivados', 'official'),
('Ovo, de codorna, inteiro, cru', 177, 13.1, 0.4, 13.7, 0.0, 130, 100, 'g', 'Ovos e derivados', 'official');

-- Bebidas (não alcoólicas)
INSERT INTO food_items (name, calories, protein, carbs, fat, fiber, sodium, portion_size, portion_unit, category, source) VALUES
('Café, infusão', 9, 0.0, 1.5, 0.0, 0.0, 1, 100, 'g', 'Bebidas', 'official'),
('Chá, de camomila, infusão', 1, 0.0, 0.2, 0.0, 0.0, 1, 100, 'g', 'Bebidas', 'official'),
('Suco, de laranja, integral', 45, 0.6, 10.4, 0.2, 0.2, 0, 100, 'g', 'Bebidas', 'official'),
('Suco, de uva, integral', 57, 0.2, 14.2, 0.0, 0.1, 3, 100, 'g', 'Bebidas', 'official'),
('Água de coco', 22, 0.0, 5.3, 0.2, 0.0, 1, 100, 'g', 'Bebidas', 'official');
