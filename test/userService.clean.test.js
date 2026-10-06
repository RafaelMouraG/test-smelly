const { UserService } = require('../src/userService');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  describe('createUser', () => {
    test('retorna o usuário com os dados informados e status "ativo"', () => {
      // Arrange
      const nome = 'Fulano de Tal';
      const email = 'fulano@teste.com';
      const idade = 25;

      // Act
      const usuario = userService.createUser(nome, email, idade);

      // Assert
      expect(usuario).toMatchObject({ nome, email, idade, status: 'ativo' });
    });

    test('gera um id para o novo usuário', () => {
      // Act
      const usuario = userService.createUser('Fulano de Tal', 'fulano@teste.com', 25);

      // Assert
      expect(typeof usuario.id).toBe('string');
      expect(usuario.id).not.toHaveLength(0);
    });

    test('gera ids diferentes para usuários diferentes', () => {
      // Arrange
      const primeiro = userService.createUser('Alice', 'alice@email.com', 28);

      // Act
      const segundo = userService.createUser('Bob', 'bob@email.com', 32);

      // Assert
      expect(segundo.id).not.toBe(primeiro.id);
    });

    test('cria usuário comum (não administrador) por padrão', () => {
      // Act
      const usuario = userService.createUser('Comum', 'comum@teste.com', 30);

      // Assert
      expect(usuario.isAdmin).toBe(false);
    });

    test('cria usuário administrador quando isAdmin é true', () => {
      // Act
      const usuario = userService.createUser('Admin', 'admin@teste.com', 40, true);

      // Assert
      expect(usuario.isAdmin).toBe(true);
    });

    test('registra a data de criação do usuário', () => {
      // Act
      const usuario = userService.createUser('Fulano', 'fulano@teste.com', 25);

      // Assert
      expect(usuario.createdAt).toBeInstanceOf(Date);
    });

    test('aceita usuário com exatamente 18 anos', () => {
      // Act
      const usuario = userService.createUser('Jovem', 'jovem@email.com', 18);

      // Assert
      expect(usuario.idade).toBe(18);
    });

    test('lança erro ao criar usuário menor de idade', () => {
      // Arrange
      const criarMenorDeIdade = () =>
        userService.createUser('Menor', 'menor@email.com', 17);

      // Act + Assert
      expect(criarMenorDeIdade).toThrow('O usuário deve ser maior de idade.');
    });

    test.each([
      ['nome', undefined, 'sem.nome@email.com', 25],
      ['email', 'Sem Email', undefined, 25],
      ['idade', 'Sem Idade', 'sem.idade@email.com', undefined],
    ])('lança erro quando o campo obrigatório "%s" não é informado', (_campo, nome, email, idade) => {
      // Arrange
      const criarUsuarioIncompleto = () => userService.createUser(nome, email, idade);

      // Act + Assert
      expect(criarUsuarioIncompleto).toThrow('Nome, email e idade são obrigatórios.');
    });
  });

  describe('getUserById', () => {
    test('retorna o usuário cadastrado com o id informado', () => {
      // Arrange
      const usuarioCriado = userService.createUser('Fulano', 'fulano@teste.com', 25);

      // Act
      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      // Assert
      expect(usuarioBuscado).toEqual(usuarioCriado);
    });

    test('retorna null quando o id não existe', () => {
      // Act
      const usuario = userService.getUserById('id-inexistente');

      // Assert
      expect(usuario).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('desativa um usuário comum e retorna true', () => {
      // Arrange
      const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);

      // Act
      const resultado = userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(resultado).toBe(true);
      expect(userService.getUserById(usuarioComum.id).status).toBe('inativo');
    });

    test('não desativa um administrador e retorna false', () => {
      // Arrange
      const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      // Act
      const resultado = userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(resultado).toBe(false);
      expect(userService.getUserById(usuarioAdmin.id).status).toBe('ativo');
    });

    test('retorna false quando o usuário não existe', () => {
      // Act
      const resultado = userService.deactivateUser('id-inexistente');

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('informa que não há usuários quando nenhum foi cadastrado', () => {
      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('Nenhum usuário cadastrado.');
    });

    test('inclui o id e o nome de todos os usuários cadastrados', () => {
      // Arrange
      const alice = userService.createUser('Alice', 'alice@email.com', 28);
      const bob = userService.createUser('Bob', 'bob@email.com', 32);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain(alice.id);
      expect(relatorio).toContain('Alice');
      expect(relatorio).toContain(bob.id);
      expect(relatorio).toContain('Bob');
      expect(relatorio).not.toContain('Nenhum usuário cadastrado.');
    });

    test('reflete o status atual do usuário', () => {
      // Arrange
      const usuario = userService.createUser('Comum', 'comum@teste.com', 30);
      userService.deactivateUser(usuario.id);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('inativo');
    });
  });
});
