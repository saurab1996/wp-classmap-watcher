export interface DirectoryConfig {
    includesDir: string;
    outputFile:  string;
}

export interface ClassInfo {
    namespace: string;
    className: string;
}

export interface ClassMap {
    [fullClass: string]: string; // 'Ns\\Class' => 'relative/path.php'
}

export interface GenerateResult {
    includesDir: string;
    count:       number;
    outputPath:  string;
    error?:      string;
}