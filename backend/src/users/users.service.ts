async findByEmail(email: string) {
  return this.userRepository.findOne({ where: { email } });
}
